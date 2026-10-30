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
