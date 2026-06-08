import { marked, type TokenizerAndRendererExtension, type Tokens } from "marked";

/**
 * GitHub-style heading slug: lowercase, strip inline HTML/punctuation (keeping
 * unicode letters so accented Portuguese headings keep their accents), collapse
 * whitespace to hyphens. Matches the anchor targets authored in the docs
 * (e.g. `[…](./troubleshooting#disconnects-every-few-minutes)`).
 */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

// lucide `link` icon, inlined as raw SVG (the React component can't be used
// inside marked's HTML string output). Revealed on heading hover via CSS.
const ANCHOR_ICON =
  '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>' +
  '<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';

// Per-parse registry so duplicate headings get GitHub-style `-1`, `-2` suffixes.
// Reset in the `preprocess` hook at the start of every parse.
let slugCounts: Record<string, number> = {};

/**
 * Platform badges, rendered from a `::: platforms desktop mobile` block so the
 * markup is defined once here instead of repeated as raw HTML in content. The
 * directive is language-agnostic (platform keys only); labels are localized
 * below from the active parse language, set by `parseMarkdown`.
 */
const BADGE_LABELS = {
  en: { desktop: "Desktop", mobile: "Mobile" },
  pt: { desktop: "Desktop", mobile: "Telemóvel" },
} as const;

type BadgeLang = keyof typeof BADGE_LABELS;
let currentLang: BadgeLang = "en";

const platformBadges: TokenizerAndRendererExtension = {
  name: "platformBadges",
  level: "block",
  start(src) {
    return src.match(/^:::[ \t]*platforms/m)?.index;
  },
  tokenizer(src) {
    const m = /^:::[ \t]*platforms[ \t]+([a-zA-Z][a-zA-Z \t]*?)[ \t]*(?:\n+|$)/.exec(src);
    if (!m) return undefined;
    return {
      type: "platformBadges",
      raw: m[0],
      platforms: m[1].trim().split(/[ \t]+/).map((s) => s.toLowerCase()),
    } as Tokens.Generic;
  },
  renderer(token) {
    const platforms = (token as Tokens.Generic & { platforms?: string[] }).platforms ?? [];
    const labels = BADGE_LABELS[currentLang];
    const spans = platforms
      .filter((p): p is keyof typeof labels => p in labels)
      .map((p) => `<span class="ver-badge ver-badge--${p}">${labels[p]}</span>`)
      .join("");
    return spans ? `<p class="ver-badges">${spans}</p>\n` : "";
  },
};

marked.use({
  extensions: [platformBadges],
  hooks: {
    preprocess(markdown) {
      slugCounts = {};
      return markdown;
    },
  },
  renderer: {
    heading({ tokens, depth, text }) {
      const html = this.parser.parseInline(tokens);
      // Slug from the raw heading text (not the entity-encoded HTML), so quotes
      // and apostrophes drop out the way GitHub's slugger does.
      const base = slugifyHeading(text);
      const n = slugCounts[base] ?? 0;
      slugCounts[base] = n + 1;
      const id = n === 0 ? base : `${base}-${n}`;
      // Section headings (h2+) get a hover-revealed permalink icon; the page
      // title (h1) is left clean.
      const anchor =
        depth > 1
          ? `<a class="heading-anchor" href="#${id}" aria-label="Permalink to this section" tabindex="-1">${ANCHOR_ICON}</a>`
          : "";
      return `<h${depth} id="${id}">${anchor}${html}</h${depth}>\n`;
    },
  },
});

export function parseMarkdown(src: string, lang: string = "en"): string {
  currentLang = (lang in BADGE_LABELS ? lang : "en") as BadgeLang;
  return marked.parse(src) as string;
}
