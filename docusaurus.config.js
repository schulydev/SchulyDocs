// @ts-check
// Docusaurus config for the unified Schuly docs site.
// Each source repo's docs/ folder is synced into docs/<Repo>/ by CI (see README).
import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Schuly Docs',
  tagline: 'Documentation for the Schuly project',

  // TODO: set this to your real domain once the Cloudflare Pages custom domain is wired up.
  // For the default *.pages.dev subdomain this value is cosmetic (used for sitemap/SEO only).
  url: 'https://schuly-docs.pages.dev',
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
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          // Docs are the whole site — serve them at the root.
          routeBasePath: '/',
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
      navbar: {
        title: 'Schuly Docs',
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
            title: 'Project',
            items: [
              { label: 'Mobile app (Schuly)', to: '/Schuly/' },
              { label: 'Backend', to: '/SchulyBackend/' },
              { label: 'Website', to: '/SchulyWebsite/' },
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
