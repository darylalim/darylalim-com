// Checks a deployed copy of the site: JSON-LD, Open Graph tags, robots.txt,
// sitemap and RSS. Usage: npm run check:seo -- <base-url>
// <base-url> is a site root (a branch preview or https://darylalim.com/), not a page.
// Uses Node's fetch, since macOS curl fails the TLS handshake with *.workers.dev.
// The 404 page isn't checked: previews return a plain "Not found" instead.
const usage = (msg) => {
  if (msg) console.error(msg);
  console.error("Usage: npm run check:seo -- <base-url>");
  process.exit(2);
};
if (!process.argv[2]) usage();
let given;
try {
  given = new URL(process.argv[2]);
} catch {
  usage(`Not a URL: ${process.argv[2]}`);
}
if (!["http:", "https:"].includes(given.protocol))
  usage(`Use an http(s) URL, not ${given.protocol}`);
// Every check is relative to the site root (/, /rss.xml, /sitemap-index.xml),
// so a page URL would make nearly all of them fail for the wrong reason
if (given.pathname !== "/" || given.search || given.hash)
  usage(
    `Give the site root, not a page: ${process.argv[2]}\n` +
      `Try: npm run check:seo -- ${given.origin}/`,
  );
const base = given.origin;
// Canonicals, og:url, sitemap and feed links always point at `site`, wherever the copy is served
const SITE = "https://darylalim.com";
let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) failures++;
};
const get = async (path) => {
  const r = await fetch(base + path, { redirect: "manual" });
  return {
    status: r.status,
    type: r.headers.get("content-type") ?? "",
    text: await r.text(),
  };
};

// Home: JSON-LD
const home = await get("/");
ok(home.status === 200, `/ → ${home.status}`);
const ld = [
  ...home.text.matchAll(
    /<script type="application\/ld\+json">(.*?)<\/script>/gs,
  ),
];
ok(ld.length === 1, `one JSON-LD block on / (found ${ld.length})`);
let data;
try {
  data = JSON.parse(ld[0][1]);
} catch (e) {
  ok(false, `JSON-LD parses: ${e.message}`);
}
if (data) {
  const p = data.mainEntity ?? {};
  ok(
    data["@type"] === "ProfilePage" && p["@type"] === "Person",
    "ProfilePage → Person",
  );
  for (const k of ["name", "url", "jobTitle"])
    ok(Boolean(p[k]), `Person.${k} = ${JSON.stringify(p[k])}`);
  ok(
    Array.isArray(p.sameAs) && p.sameAs.length === 2,
    `sameAs = ${JSON.stringify(p.sameAs)}`,
  );
  ok(!p.address?.streetAddress, "no street address");
}

// OG tags on each kind of page
const meta = (html, attr, name) =>
  html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`))?.[1];
for (const path of [
  "/",
  "/blog/",
  "/blog/why-i-build-ai-that-runs-on-your-own-machine/",
  "/projects/",
  "/resume/",
]) {
  const { status, text } = path === "/" ? home : await get(path);
  const tags = [
    "og:type",
    "og:title",
    "og:description",
    "og:url",
    "og:image",
    "og:image:alt",
  ].map((n) => [n, meta(text, "property", n)]);
  const missing = tags.filter(([, v]) => !v).map(([n]) => n);
  const canonical = text.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  const ogUrl = meta(text, "property", "og:url");
  ok(
    status === 200 && missing.length === 0,
    `${path} OG tags${missing.length ? " missing " + missing : ""}`,
  );
  ok(
    canonical === `${SITE}${path}` && ogUrl === canonical,
    `${path} canonical = og:url = ${canonical}`,
  );
  ok(
    meta(text, "name", "twitter:card") === "summary_large_image",
    `${path} twitter:card`,
  );
  if (path.startsWith("/blog/why"))
    ok(
      meta(text, "property", "og:type") === "article",
      "post og:type = article",
    );
}
// The OG image itself (absolute URL points at production; fetch the preview's copy)
const img = await fetch(base + "/og-default.png");
const buf = Buffer.from(await img.arrayBuffer());
ok(
  img.status === 200 && img.headers.get("content-type") === "image/png",
  `og-default.png → ${img.status} ${img.headers.get("content-type")}`,
);
ok(
  buf.readUInt32BE(16) === 1200 && buf.readUInt32BE(20) === 630,
  `og-default.png is ${buf.readUInt32BE(16)}×${buf.readUInt32BE(20)}`,
);

// robots.txt
const robots = await get("/robots.txt");
ok(
  robots.status === 200 && robots.type.startsWith("text/plain"),
  `/robots.txt → ${robots.status} ${robots.type}`,
);
ok(
  robots.text.includes(`Sitemap: ${SITE}/sitemap-index.xml`),
  "robots.txt names the sitemap index",
);

// Sitemap
const idx = await get("/sitemap-index.xml");
ok(
  idx.status === 200 && idx.text.includes("<sitemapindex"),
  `/sitemap-index.xml → ${idx.status}`,
);
const sm = await get("/sitemap-0.xml");
const locs = [...sm.text.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
ok(
  locs.length > 0 &&
    locs.every((l) => l.startsWith(`${SITE}/`) && l.endsWith("/")),
  `sitemap: ${locs.length} URLs, all absolute with trailing slash`,
);
ok(!locs.some((l) => l.includes("404")), "sitemap leaves out the 404");

// RSS
const rss = await get("/rss.xml");
ok(
  rss.status === 200 && /xml/.test(rss.type),
  `/rss.xml → ${rss.status} ${rss.type}`,
);
for (const tag of [
  "<rss",
  "<channel>",
  "<title>",
  "<link>",
  "<description>",
  "<item>",
  "<pubDate>",
  "<guid",
  "<content:encoded>",
])
  ok(rss.text.includes(tag), `RSS has ${tag}`);
const items = [...rss.text.matchAll(/<item>.*?<link>([^<]*)<\/link>/gs)].map(
  (m) => m[1],
);
ok(
  items.every((l) => l.startsWith(`${SITE}/`) && l.endsWith("/")),
  `RSS item links: ${items.join(", ")}`,
);
ok(!rss.text.includes("[TODO"), "RSS has no [TODO");

console.log(failures ? `\n${failures} failure(s)` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
