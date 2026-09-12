// Rewrites the block between BLOG-POST-LIST markers in profile/README.md
// with the newest items from the ByteGurus RSS feed. No dependencies.
import { readFileSync, writeFileSync } from "node:fs";

const FEED = "https://www.bytegurus.io/blog/rss.xml";
const README = "profile/README.md";
const COUNT = 5;

const xml = await (await fetch(FEED)).text();

const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
  .map(([, body]) => {
    const pick = (tag) => {
      const m = body.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
      if (!m) return "";
      return m[1]
        .replace(/^<!\[CDATA\[|\]\]>$/g, "")
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .trim();
    };
    return { title: pick("title"), link: pick("link"), date: new Date(pick("pubDate")) };
  })
  .filter((i) => i.title && i.link)
  .slice(0, COUNT);

if (items.length === 0) {
  console.error("feed returned no items; leaving README untouched");
  process.exit(1);
}

const fmt = (d) => d.toISOString().slice(0, 10);
const list = items.map((i) => `- [${i.title}](${i.link}) — ${fmt(i.date)}`).join("\n");

const start = "<!-- BLOG-POST-LIST:START -->";
const end = "<!-- BLOG-POST-LIST:END -->";
const md = readFileSync(README, "utf8");
const next = md.replace(
  new RegExp(`${start}[\\s\\S]*?${end}`),
  `${start}\n${list}\n${end}`,
);

if (next === md) {
  console.log("no change");
} else {
  writeFileSync(README, next);
  console.log(`updated with ${items.length} posts`);
}
