import manifest from "../../public/hero/manifest.json";

export type HeroTier = { dir: string; width: number; height: number; bytes: number };
export type HeroManifest = {
  total: number;
  first: number;
  pad: number;
  ext: string;
  tiers: Record<"hd" | "sd", HeroTier>;
};

export const heroManifest = manifest as HeroManifest;

export function framePath(tier: HeroTier, index: number, m: HeroManifest = heroManifest) {
  return `${tier.dir}/${String(index + m.first).padStart(m.pad, "0")}.${m.ext}`;
}
