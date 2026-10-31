// Site-wide values shared by the layout, and later the RSS feed and JSON-LD.
export const SITE_TITLE = "Daryl Lim";
export const SITE_DESCRIPTION =
  "I build AI that runs on your own machine, and agents that show their work.";

export const NAV_LINKS = [
  { href: "/", label: "home" },
  { href: "/blog/", label: "blog" },
  { href: "/projects/", label: "projects" },
  { href: "/resume/", label: "resume" },
];

// Profiles get rel="me", which ties them to this site as the same person.
// Email (hello@darylalim.com) joins once Email Routing is live in Phase 5;
// until then mail to it would bounce.
export const FOOTER_LINKS = [
  { href: "https://github.com/darylalim", label: "github", me: true },
  {
    href: "https://www.linkedin.com/in/daryl-lim-862a815",
    label: "linkedin",
    me: true,
  },
  { href: "/rss.xml", label: "rss", me: false },
];

// Project themes, in page order. content.config.ts builds the `theme` enum
// from these ids, so a project can't name a theme the page doesn't show.
export const PROJECT_THEMES = [
  {
    id: "on-device-ai",
    label: "On-device AI",
    blurb: "Runs on Apple Silicon with MLX. Your files never leave the Mac.",
  },
  {
    id: "agents",
    label: "Agents",
    blurb:
      "Agent systems on Deep Agents and Claude that cite their evidence and leave the arithmetic to tools.",
  },
  {
    id: "healthcare",
    label: "Healthcare AI",
    blurb: "Clinical tools built around review, sign-off and privacy.",
  },
  {
    id: "retrieval",
    label: "Retrieval",
    blurb: "Search and question answering over your own documents, measured.",
  },
] as const;

export type ProjectThemeId = (typeof PROJECT_THEMES)[number]["id"];

export const GITHUB_REPOS_URL = "https://github.com/darylalim?tab=repositories";
