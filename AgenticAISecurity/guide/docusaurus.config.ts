import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import { themes as prismThemes } from "prism-react-renderer";

// Public URL of the deployed guide. scripts/deploy.sh sets GUIDE_URL to the
// Worker's workers.dev URL; override it when serving from a custom domain.
const guideUrl = process.env.GUIDE_URL ?? "http://localhost:3000";

const config: Config = {
  title: "Architecting for Agentic AI",
  tagline: "Hands-on lab guide",
  url: guideUrl,
  baseUrl: "/",
  onBrokenLinks: "throw",
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    navbar: {
      title: "Architecting for Agentic AI",
      logo: {
        alt: "Cloudflare",
        src: "img/Cloudflare_Logo.png",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "labSidebar",
          position: "left",
          label: "Lab Guide",
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "json", "typescript"],
    },
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
