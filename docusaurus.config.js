// @ts-check
// Docusaurus config for the unified Schuly docs site.
// Each source repo's docs/ folder is synced into docs/<Repo>/ by CI (see README).
import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Schuly Docs',
  tagline: 'Documentation for the Schuly project',
  favicon: 'img/favicon.ico',

  url: 'https://docs.schuly.dev',
  baseUrl: '/',

  organizationName: 'schulydev',
  projectName: 'SchulyDocs',

  // Synced docs link across repos with full URLs and relative links; keep the build
  // resilient instead of failing on the occasional cross-repo relative link.
  onBrokenLinks: 'warn',
  onBrokenAnchors: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Source repos write plain GitHub-flavored Markdown (with raw <angle-bracket>
  // placeholders, generics, etc.). Parse .md as CommonMark so MDX doesn't try to
  // interpret those as JSX and fail the build; .mdx still gets full MDX if ever needed.
  markdown: {
    format: 'detect',
    // Render ```mermaid code blocks as diagrams (needs @docusaurus/theme-mermaid below).
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // Mermaid diagram rendering.
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          // Docs live under /docs/* so the custom landing page can own the site root.
          routeBasePath: '/docs',
          sidebarPath: './sidebars.js',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social-card.png',
      colorMode: {
        // The Schuly website is a dark, monochrome design — default to dark to match.
        defaultMode: 'dark',
        respectPrefersColorScheme: false,
      },
      mermaid: {
        theme: { light: 'neutral', dark: 'dark' },
      },
      navbar: {
        title: 'Schuly Docs',
        logo: {
          alt: 'Schuly',
          src: 'img/logo.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docs',
            position: 'left',
            label: 'Docs',
          },
          {
            href: 'https://github.com/schulydev',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Sections',
            items: [
              { label: 'Mobile app (Schuly)', to: '/docs/Schuly/' },
              { label: 'Backend (.NET API)', to: '/docs/SchulyBackend/' },
              { label: 'Website', to: '/docs/SchulyWebsite/' },
              { label: 'Keycloak (auth)', to: '/docs/SchulyKeycloak/' },
            ],
          },
          {
            title: 'Plugins',
            items: [
              { label: 'Plugin abstractions', to: '/docs/SchulyPluginAbstractions/' },
              { label: 'Plugins', to: '/docs/SchulyPlugins/' },
            ],
          },
          {
            title: 'More',
            items: [
              { label: 'GitHub org', href: 'https://github.com/schulydev' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Schuly.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'csharp', 'dart', 'json', 'yaml'],
      },
    }),
};

export default config;
