import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { openGraphBase, SITE_URL } from "./seo";

/**
 * The share card, pinned.
 *
 * Next merges metadata objects *shallowly*: a page that declares `openGraph`
 * at all replaces the layout's entire object rather than the keys it names. The
 * home page declared `openGraph: { title, description }` and thereby dropped
 * the image, the url, the type and the locale — so the most-shared URL on the
 * site posted to Telegram and LinkedIn with no preview card at all, while every
 * page that had *not* customised its metadata kept one.
 *
 * That failure is silent in every way that matters: the build passes, the page
 * renders, the tags that remain are correct, and nothing surfaces until someone
 * pastes a link into a chat. This is the cheapest place to notice.
 */
describe("open graph asosi", () => {
  it("rasmni har doim beradi", () => {
    const og = openGraphBase("/");
    assert.ok(Array.isArray(og.images) && og.images.length > 0, "rasm bo'lishi shart");
    assert.ok(og.images[0].url.startsWith("https://"), "mutlaq havola bo'lsin");
    assert.ok(og.images[0].alt.length > 0, "alt matn bo'lsin");
    // Width and height let the platform reserve space before the file lands.
    assert.ok(og.images[0].width > 0 && og.images[0].height > 0);
  });

  it("yo'lni mutlaq manzilga aylantiradi", () => {
    assert.equal(openGraphBase("/").url, SITE_URL);
    assert.equal(openGraphBase("/pricing").url, `${SITE_URL}/pricing`);
    assert.equal(openGraphBase("/work/altron").url, `${SITE_URL}/work/altron`);
  });

  it("nisbiy havola qoldirmaydi", () => {
    // A relative og:image is ignored by most crawlers, which is the same as
    // having none — and it looks correct in the HTML, which is worse.
    const og = openGraphBase("/pricing");
    assert.ok(og.url.startsWith("https://"));
    for (const image of og.images) assert.ok(image.url.startsWith("https://"));
  });

  it("til va sayt nomini saqlaydi", () => {
    const og = openGraphBase("/");
    assert.equal(og.locale, "uz_UZ");
    assert.equal(og.type, "website");
    assert.ok(og.siteName.length > 0);
  });

  it("localhost hech qachon chiqmaydi", () => {
    // The production build once shipped `http://localhost:3000` in every
    // canonical tag and structured-data id because one environment variable
    // was wrong. Nothing here should ever be able to say that again.
    const og = openGraphBase("/");
    assert.ok(!og.url.includes("localhost"), "url localhost bo'lmasin");
    for (const image of og.images) {
      assert.ok(!image.url.includes("localhost"), "rasm localhost bo'lmasin");
    }
  });
});
