import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

const config: Config = {
  title: "ShareDock",
  tagline:
    "ShareDock is a private file relay for personal developers and small teams.",
  favicon: "img/sharedock.svg",

  url: "https://toyohin.github.io",
  baseUrl: "/sharedock/",
  organizationName: "ToYOhin",
  projectName: "sharedock",

  onBrokenLinks: "warn",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/ToYOhin/sharedock/edit/main/docs",
        },
        blog: false,
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/sharedock.svg",
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "ShareDock",
      logo: {
        alt: "ShareDock logo",
        src: "img/sharedock.svg",
      },
      items: [
        {
          href: "https://github.com/ToYOhin/sharedock",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
