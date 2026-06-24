import { withMermaid } from 'vitepress-plugin-mermaid'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DOCS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Each synced source repo gets a section folder under docs/. Order + display label
// live here (this replaces Docusaurus' per-folder _category_.json). Contributors only
// edit markdown in the source repos — the sidebar below is generated from the files.
const SECTIONS = [
  { dir: 'getting-started', text: 'Getting started' },
  { dir: 'Schuly', text: 'Mobile app (Schuly)' },
  { dir: 'SchulyBackend', text: 'Backend (.NET API)' },
  { dir: 'SchulyWebsite', text: 'Website' },
  { dir: 'SchulyKeycloak', text: 'Keycloak (auth)' },
  { dir: 'SchulyPluginAbstractions', text: 'Plugin abstractions' },
  { dir: 'SchulyPlugins', text: 'Plugins' },
]

// --- tiny helpers so the sidebar/rewrites build themselves from the file tree ---

function readMeta(file) {
  const raw = fs.readFileSync(file, 'utf8')
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  let title, position
  if (fm) {
    const t = fm[1].match(/^title:\s*(.+)$/m)
    if (t) title = t[1].trim().replace(/^['"]|['"]$/g, '')
    const p = fm[1].match(/^sidebar_position:\s*(\d+)/m)
    if (p) position = Number(p[1])
  }
  if (!title) {
    const h1 = raw.replace(/^---[\s\S]*?---/, '').match(/^#\s+(.+)$/m)
    if (h1) title = h1[1].trim()
  }
  return { title, position }
}

function humanize(name) {
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// Build sidebar items for a folder. README is exposed as the group link, not a child.
function itemsFor(dir, urlBase) {
  const abs = path.join(DOCS_ROOT, dir)
  const entries = fs.readdirSync(abs, { withFileTypes: true })

  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith('.md') && e.name !== 'README.md')
    .map((e) => {
      const meta = readMeta(path.join(abs, e.name))
      const slug = e.name.replace(/\.md$/, '')
      return {
        text: meta.title || humanize(slug),
        link: `${urlBase}/${slug}`,
        position: meta.position ?? Infinity,
        name: e.name,
      }
    })
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
    .map(({ text, link }) => ({ text, link }))

  const folders = entries
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => ({
      text: humanize(e.name),
      collapsed: true,
      items: itemsFor(path.join(dir, e.name), `${urlBase}/${e.name}`),
    }))

  return [...files, ...folders]
}

function buildSidebar() {
  return SECTIONS.filter((s) => fs.existsSync(path.join(DOCS_ROOT, s.dir))).map((s) => ({
    text: s.text,
    link: `/${s.dir}/`, // README.md (rewritten to index) is the section landing page
    collapsed: false,
    items: itemsFor(s.dir, `/${s.dir}`),
  }))
}

// VitePress only treats index.md as a folder index; source repos use README.md
// (the GitHub convention). Remap every README.md -> index.md so /<Section>/ resolves.
function buildRewrites() {
  const map = {}
  const walk = (rel) => {
    for (const e of fs.readdirSync(path.join(DOCS_ROOT, rel), { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) {
        if (e.name === '.vitepress' || e.name === 'public') continue
        walk(r)
      } else if (e.name === 'README.md') {
        map[r] = r.replace(/README\.md$/, 'index.md')
      }
    }
  }
  walk('')
  return map
}

export default withMermaid({
  title: 'Schuly Docs',
  description: 'Documentation for the Schuly project',
  lang: 'en-US',

  // Synced docs carry cross-repo relative links; don't fail the build over them.
  ignoreDeadLinks: true,
  cleanUrls: true,

  rewrites: buildRewrites(),

  head: [
    ['link', { rel: 'icon', href: '/img/favicon.ico' }],
    ['meta', { property: 'og:image', content: '/img/social-card.png' }],
  ],

  themeConfig: {
    logo: '/img/logo.png',

    nav: [
      { text: 'Getting started', link: '/getting-started/' },
      {
        text: 'Projects',
        items: SECTIONS.filter((s) => s.dir !== 'getting-started').map((s) => ({
          text: s.text,
          link: `/${s.dir}/`,
        })),
      },
    ],

    sidebar: buildSidebar(),

    socialLinks: [{ icon: 'github', link: 'https://github.com/schulydev' }],

    search: { provider: 'local' },

    footer: {
      message: 'Edit docs in each source repo — they sync here automatically.',
      copyright: `Copyright © ${new Date().getFullYear()} Schuly`,
    },

    editLink: undefined,
  },
})
