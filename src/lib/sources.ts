import "server-only";

import { getIntegrationSecret } from "./integrations";

/**
 * Pulls project metadata straight out of GitHub or Vercel so a case study can
 * be started from a repository URL instead of retyped by hand.
 *
 * Tokens are optional by design. Public repositories answer anonymously, which
 * keeps the panel useful on a fresh checkout; `GITHUB_TOKEN` only raises the
 * hourly limit and unlocks private repos, and `VERCEL_TOKEN` only unlocks the
 * project API — a plain `*.vercel.app` URL is still recognised without it.
 */

export type SourceKind = "github" | "vercel" | "manual";

export type ImportedSource = {
  kind: SourceKind;
  slug: string;
  title: string;
  summary: string;
  stack: string[];
  year: string;
  sourceUrl: string;
  liveUrl: string;
};

export type ImportResult = { ok: true; data: ImportedSource } | { ok: false; error: string };

/** Ten seconds is already longer than either API takes when it is healthy. */
const TIMEOUT_MS = 10_000;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function getJson(url: string, headers: Record<string, string>): Promise<unknown> {
  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    // Import is an explicit "fetch it now" button; a cached answer defeats it.
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = res.status === 404 ? "topilmadi" : `HTTP ${res.status}`;
    throw new Error(detail);
  }
  return res.json();
}

// ------------------------------------------------------------------- github

/** Accepts a full URL, an `owner/repo` pair, or an `scp`-style clone address. */
function parseRepo(raw: string): { owner: string; repo: string } | null {
  const input = raw.trim().replace(/\.git$/, "");
  if (!input) return null;

  const fromUrl = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s?#]+)/i.exec(input);
  if (fromUrl) return { owner: fromUrl[1], repo: fromUrl[2] };

  const fromScp = /^git@github\.com:([^/\s]+)\/([^/\s]+)$/i.exec(input);
  if (fromScp) return { owner: fromScp[1], repo: fromScp[2] };

  const bare = /^([\w.-]+)\/([\w.-]+)$/.exec(input);
  if (bare) return { owner: bare[1], repo: bare[2] };

  return null;
}

type GithubRepo = {
  name: string;
  description: string | null;
  homepage: string | null;
  html_url: string;
  created_at: string;
  topics?: string[];
  language: string | null;
};

export async function importFromGithub(input: string): Promise<ImportResult> {
  const parsed = parseRepo(input);
  if (!parsed) {
    return { ok: false, error: "GitHub havolasi tanilmadi. Namuna: github.com/ism/repo" };
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "obsidian-portfolio",
  };
  const token = (await getIntegrationSecret("githubToken")) ?? process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const base = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`;

  let repo: GithubRepo;
  try {
    repo = (await getJson(base, headers)) as GithubRepo;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "noma'lum xato";
    return {
      ok: false,
      error:
        detail === "topilmadi"
          ? "Repozitoriy topilmadi. Yopiq bo'lsa .env.local ga GITHUB_TOKEN qo'shing."
          : `GitHub javob bermadi (${detail})`,
    };
  }

  // Languages is a nice-to-have; a repo with none must still import.
  let languages: string[] = [];
  try {
    const raw = (await getJson(`${base}/languages`, headers)) as Record<string, number>;
    languages = Object.entries(raw)
      .sort(([, a], [, b]) => b - a)
      .map(([name]) => name);
  } catch {
    languages = repo.language ? [repo.language] : [];
  }

  // Topics describe intent ("saas", "telegram-bot"); languages describe bytes.
  // Topics lead because they are what a reader recognises, and each side is
  // capped before merging — otherwise a repo with twelve detected languages
  // pushes every topic past the end of the list.
  const stack = [
    ...new Set([...(repo.topics ?? []).slice(0, 6), ...languages.slice(0, 6)]),
  ].slice(0, 10);

  return {
    ok: true,
    data: {
      kind: "github",
      slug: slugify(repo.name),
      title: repo.name,
      summary: repo.description ?? "",
      stack,
      year: String(new Date(repo.created_at).getUTCFullYear()),
      sourceUrl: repo.html_url,
      liveUrl: normaliseUrl(repo.homepage ?? ""),
    },
  };
}

// ------------------------------------------------------------------- vercel

type VercelProject = {
  name: string;
  framework: string | null;
  createdAt?: number;
  targets?: { production?: { url?: string; alias?: string[] } };
  latestDeployments?: { url?: string; alias?: string[] }[];
  link?: { type?: string; org?: string; repo?: string };
};

/** `myapp.vercel.app`, `https://myapp.vercel.app/x` → the project name. */
function projectFromDeploymentUrl(raw: string): { name: string; liveUrl: string } | null {
  const match = /^(?:https?:\/\/)?([a-z0-9-]+)\.vercel\.app/i.exec(raw.trim());
  if (!match) return null;
  return { name: match[1], liveUrl: `https://${match[1]}.vercel.app` };
}

/** `vercel.com/team/project` or `vercel.com/team/project/settings` → project. */
function projectFromDashboardUrl(raw: string): string | null {
  const match = /^(?:https?:\/\/)?(?:www\.)?vercel\.com\/[^/\s]+\/([^/\s?#]+)/i.exec(raw.trim());
  return match ? match[1] : null;
}

function pickVercelUrl(project: VercelProject): string {
  const production = project.targets?.production;
  const latest = project.latestDeployments?.[0];
  // An alias is the stable custom/production domain; `url` is the immutable
  // per-deployment host, which changes on every push and reads as noise.
  const host =
    production?.alias?.[0] ??
    production?.url ??
    latest?.alias?.[0] ??
    latest?.url ??
    `${project.name}.vercel.app`;
  return normaliseUrl(host);
}

export async function importFromVercel(input: string): Promise<ImportResult> {
  const token = (await getIntegrationSecret("vercelToken")) ?? process.env.VERCEL_TOKEN;
  const deployment = projectFromDeploymentUrl(input);
  const identifier = projectFromDashboardUrl(input) ?? deployment?.name ?? input.trim();

  if (!identifier) return { ok: false, error: "Vercel loyihasi nomi yoki havolasi kerak" };

  // Without a token we can still do the useful half of the job: a deployment
  // URL is enough to screenshot the site and name the project.
  if (!token) {
    if (!deployment) {
      return {
        ok: false,
        error: "Vercel API uchun VERCEL_TOKEN kerak. Tokensiz faqat *.vercel.app havolasi ishlaydi.",
      };
    }
    return {
      ok: true,
      data: {
        kind: "vercel",
        slug: slugify(deployment.name),
        title: deployment.name,
        summary: "",
        stack: [],
        year: String(new Date().getUTCFullYear()),
        sourceUrl: deployment.liveUrl,
        liveUrl: deployment.liveUrl,
      },
    };
  }

  const team = process.env.VERCEL_TEAM_ID;
  const query = team ? `?teamId=${encodeURIComponent(team)}` : "";

  let project: VercelProject;
  try {
    project = (await getJson(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(identifier)}${query}`,
      { Authorization: `Bearer ${token}` },
    )) as VercelProject;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "noma'lum xato";
    return {
      ok: false,
      error:
        detail === "topilmadi"
          ? `Vercel'da «${identifier}» loyihasi topilmadi. Jamoa loyihasi bo'lsa VERCEL_TEAM_ID qo'shing.`
          : `Vercel javob bermadi (${detail})`,
    };
  }

  const liveUrl = pickVercelUrl(project);
  const repo = project.link?.repo;
  const org = project.link?.org;

  return {
    ok: true,
    data: {
      kind: "vercel",
      slug: slugify(project.name),
      title: project.name,
      summary: "",
      stack: project.framework ? [project.framework] : [],
      year: String(new Date(project.createdAt ?? Date.now()).getUTCFullYear()),
      sourceUrl: org && repo ? `https://github.com/${org}/${repo}` : liveUrl,
      liveUrl,
    },
  };
}

// -------------------------------------------------------------------- shared

/** Bare hosts come back from both APIs; the screenshot renderer needs a scheme. */
export function normaliseUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

/** Picks the importer from the URL itself, so the panel needs one input box. */
export async function importFromUrl(input: string, kind?: SourceKind): Promise<ImportResult> {
  const value = input.trim();
  if (!value) return { ok: false, error: "Havolani kiriting" };

  if (kind === "github") return importFromGithub(value);
  if (kind === "vercel") return importFromVercel(value);

  if (/vercel\.(app|com)/i.test(value)) return importFromVercel(value);
  return importFromGithub(value);
}
