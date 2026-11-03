import { withMermaid } from 'vitepress-plugin-mermaid'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DOCS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// The site is organized by reader, not by repo: these are the top-nav entries, each with
// a landing page owned by this repo. A synced page belongs to an audience only if listed
// in `pages`; any other page lands under Contribute, so a new markdown file always shows up.
// getting-started has no `pages`: its sidebar is generated from its own folder.
const AUDIENCES = [
  {
    dir: 'getting-started',
    text: { en: 'Use Schuly', de: 'Schuly nutzen', fr: 'Utiliser Schuly', it: 'Usare Schuly' },
  },
  {
    dir: 'self-host',
    text: { en: 'Self-host', de: 'Selbst hosten', fr: 'Auto-héberger', it: 'Self-hosting' },
    pages: ['SchulyServer/setup/self-hosting', 'SchulyServer/setup/self-hosting-lan', 'SchulyServer/setup/operations', 'SchulyServer/plugin-management', 'SchulyServer/setup/configuration'],
  },
  {
    dir: 'build-plugins',
    text: { en: 'Build plugins', de: 'Plugins entwickeln', fr: 'Créer des plugins', it: 'Creare plugin' },
    pages: ['SchulyPlugins/setup/development', 'SchulyPlugins/adding-a-plugin', 'SchulyPlugins/migrations', 'SchulyPlugins/setup/distribution', 'SchulyPluginAbstractions/contract', 'SchulyPluginAbstractions/versioning'],
  },
]
const CONTRIBUTE = { dir: 'contribute', text: { en: 'Contribute', de: 'Mitwirken', fr: 'Contribuer', it: 'Contribuire' } }

// Each synced source repo gets a section folder under docs/, shown under Contribute. Order +
// per-locale display label live here. Contributors only edit markdown in the source repos -
// the English sidebar is generated from the files. Translated sections
// (docs/<locale>/<Repo>/) are owned directly in this repo.
const SECTIONS = [
  {
    dir: 'Schuly',
    text: {
      en: 'Mobile app (Schuly)',
      de: 'Mobile App (Schuly)',
      fr: 'Application mobile (Schuly)',
      it: 'App mobile (Schuly)',
    },
  },
  {
    dir: 'SchulyServer',
    text: {
      en: 'Server (.NET API + web app)',
      de: 'Server (.NET-API + Web-App)',
      fr: 'Serveur (API .NET + app web)',
      it: 'Server (API .NET + app web)',
    },
  },
  {
    dir: 'SchulyWebsite',
    text: { en: 'Website', de: 'Website', fr: 'Site web', it: 'Sito web' },
  },
  {
    dir: 'SchulyPluginAbstractions',
    text: {
      en: 'Plugin abstractions',
      de: 'Plugin-Abstraktionen',
      fr: 'Abstractions de plugin',
      it: 'Astrazioni dei plugin',
    },
  },
  {
    dir: 'SchulyPlugins',
    text: { en: 'Plugins', de: 'Plugins', fr: 'Plugins', it: 'Plugin' },
  },
  {
    dir: 'SchulyMicrosoft',
    text: { en: 'Microsoft 365 service', de: 'Microsoft-365-Dienst', fr: 'Service Microsoft 365', it: 'Servizio Microsoft 365' },
  },
]

// root = English, unprefixed paths (docs/<Repo>/**). Others live under docs/<locale>/<Repo>/**.
const LOCALES = ['en', 'de', 'fr', 'it']

const UI_TEXT = {
  en: {
    label: 'English',
    htmlLang: 'en-US',
    title: 'Schuly Docs',
    description: 'Documentation for the Schuly project',
    editingDocs: 'Editing these docs',
    outline: 'On this page',
    prev: 'Previous page',
    next: 'Next page',
    darkModeSwitchLabel: 'Appearance',
    darkModeSwitchTitle: 'Switch to dark theme',
    lightModeSwitchTitle: 'Switch to light theme',
    sidebarMenuLabel: 'Menu',
    returnToTopLabel: 'Return to top',
    langMenuLabel: 'Change language',
    skipToContentLabel: 'Skip to content',
    footerMessage: 'Found a mistake? <a href="/editing-these-docs">Edit these docs</a>.',
    tipLabel: 'TIP',
    warningLabel: 'WARNING',
    dangerLabel: 'DANGER',
    infoLabel: 'INFO',
    detailsLabel: 'Details',
    search: {
      buttonText: 'Search',
      buttonAriaLabel: 'Search',
      displayDetails: 'Display detailed list',
      resetButtonTitle: 'Reset search',
      backButtonTitle: 'Close search',
      noResultsText: 'No results for',
      footer: {
        selectText: 'to select',
        selectKeyAriaLabel: 'enter',
        navigateText: 'to navigate',
        navigateUpKeyAriaLabel: 'up arrow',
        navigateDownKeyAriaLabel: 'down arrow',
        closeText: 'to close',
        closeKeyAriaLabel: 'escape',
      },
    },
  },
  de: {
    label: 'Deutsch',
    htmlLang: 'de-CH',
    title: 'Schuly Docs',
    description: 'Dokumentation für das Schuly-Projekt',
    editingDocs: 'Diese Docs bearbeiten',
    outline: 'Auf dieser Seite',
    prev: 'Vorherige Seite',
    next: 'Nächste Seite',
    darkModeSwitchLabel: 'Darstellung',
    darkModeSwitchTitle: 'Zum dunklen Design wechseln',
    lightModeSwitchTitle: 'Zum hellen Design wechseln',
    sidebarMenuLabel: 'Menü',
    returnToTopLabel: 'Nach oben',
    langMenuLabel: 'Sprache wechseln',
    skipToContentLabel: 'Zum Inhalt springen',
    footerMessage: 'Fehler gefunden? <a href="/editing-these-docs">Docs bearbeiten</a>.',
    tipLabel: 'TIPP',
    warningLabel: 'ACHTUNG',
    dangerLabel: 'GEFAHR',
    infoLabel: 'INFO',
    detailsLabel: 'Details',
    search: {
      buttonText: 'Suchen',
      buttonAriaLabel: 'Suchen',
      displayDetails: 'Detaillierte Liste anzeigen',
      resetButtonTitle: 'Suche zurücksetzen',
      backButtonTitle: 'Suche schliessen',
      noResultsText: 'Keine Ergebnisse für',
      footer: {
        selectText: 'auswählen',
        selectKeyAriaLabel: 'eingabetaste',
        navigateText: 'navigieren',
        navigateUpKeyAriaLabel: 'pfeil nach oben',
        navigateDownKeyAriaLabel: 'pfeil nach unten',
        closeText: 'schliessen',
        closeKeyAriaLabel: 'esc',
      },
    },
  },
  fr: {
    label: 'Français',
    htmlLang: 'fr-CH',
    title: 'Schuly Docs',
    description: 'Documentation du projet Schuly',
    editingDocs: 'Modifier cette documentation',
    outline: 'Sur cette page',
    prev: 'Page précédente',
    next: 'Page suivante',
    darkModeSwitchLabel: 'Apparence',
    darkModeSwitchTitle: 'Passer au thème sombre',
    lightModeSwitchTitle: 'Passer au thème clair',
    sidebarMenuLabel: 'Menu',
    returnToTopLabel: 'Retour en haut',
    langMenuLabel: 'Changer de langue',
    skipToContentLabel: 'Aller au contenu',
    footerMessage: 'Une erreur ? <a href="/editing-these-docs">Modifiez cette documentation</a>.',
    tipLabel: 'ASTUCE',
    warningLabel: 'ATTENTION',
    dangerLabel: 'DANGER',
    infoLabel: 'INFO',
    detailsLabel: 'Détails',
    search: {
      buttonText: 'Rechercher',
      buttonAriaLabel: 'Rechercher',
      displayDetails: 'Afficher la liste détaillée',
      resetButtonTitle: 'Réinitialiser la recherche',
      backButtonTitle: 'Fermer la recherche',
      noResultsText: 'Aucun résultat pour',
      footer: {
        selectText: 'pour sélectionner',
        selectKeyAriaLabel: 'entrée',
        navigateText: 'pour naviguer',
        navigateUpKeyAriaLabel: 'flèche haut',
        navigateDownKeyAriaLabel: 'flèche bas',
        closeText: 'pour fermer',
        closeKeyAriaLabel: 'échap',
      },
    },
  },
  it: {
    label: 'Italiano',
    htmlLang: 'it-CH',
    title: 'Schuly Docs',
    description: 'Documentazione del progetto Schuly',
    editingDocs: 'Modifica questa documentazione',
    outline: 'In questa pagina',
    prev: 'Pagina precedente',
    next: 'Pagina successiva',
    darkModeSwitchLabel: 'Aspetto',
    darkModeSwitchTitle: 'Passa al tema scuro',
    lightModeSwitchTitle: 'Passa al tema chiaro',
    sidebarMenuLabel: 'Menu',
    returnToTopLabel: 'Torna su',
    langMenuLabel: 'Cambia lingua',
    skipToContentLabel: 'Vai al contenuto',
    footerMessage: 'Trovato un errore? <a href="/editing-these-docs">Modifica questa documentazione</a>.',
    tipLabel: 'SUGGERIMENTO',
    warningLabel: 'ATTENZIONE',
    dangerLabel: 'PERICOLO',
    infoLabel: 'INFO',
    detailsLabel: 'Dettagli',
    search: {
      buttonText: 'Cerca',
      buttonAriaLabel: 'Cerca',
      displayDetails: 'Mostra elenco dettagliato',
      resetButtonTitle: 'Reimposta ricerca',
      backButtonTitle: 'Chiudi ricerca',
      noResultsText: 'Nessun risultato per',
      footer: {
        selectText: 'per selezionare',
        selectKeyAriaLabel: 'invio',
        navigateText: 'per navigare',
        navigateUpKeyAriaLabel: 'freccia su',
        navigateDownKeyAriaLabel: 'freccia giù',
        closeText: 'per chiudere',
        closeKeyAriaLabel: 'esc',
      },
    },
  },
}

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
function itemsFor(dir, urlBase, skip = new Set()) {
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
    .filter((f) => !skip.has(f.link))
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
    .map(({ text, link }) => ({ text, link }))

  const folders = entries
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => ({
      text: humanize(e.name),
      collapsed: true,
      items: itemsFor(path.join(dir, e.name), `${urlBase}/${e.name}`, skip),
    }))
    .filter((g) => g.items.length > 0)

  return [...files, ...folders]
}

// locale 'en' reads docs/<Repo>/**, others read docs/<locale>/<Repo>/**.
function localeDir(locale, dir) {
  return locale === 'en' ? dir : `${locale}/${dir}`
}
function localePrefix(locale) {
  return locale === 'en' ? '' : `/${locale}`
}

function pageItem(locale, page) {
  const file = path.join(DOCS_ROOT, `${localeDir(locale, page)}.md`)
  if (!fs.existsSync(file)) return null
  return { text: readMeta(file).title || humanize(path.basename(page)), link: `${localePrefix(locale)}/${page}` }
}

// One sidebar per audience. VitePress picks the key with the most path segments and, on a tie,
// the first one inserted, so a listed page must be added before its repo's folder key.
function buildSidebar(locale) {
  const t = UI_TEXT[locale]
  const prefix = localePrefix(locale)
  const sidebar = {}
  const claimed = new Set()

  for (const a of AUDIENCES) {
    const items = a.pages ? a.pages.map((p) => pageItem(locale, p)).filter(Boolean) : itemsFor(localeDir(locale, a.dir), `${prefix}/${a.dir}`)
    const group = [{ text: a.text[locale], link: `${prefix}/${a.dir}/`, items }]
    sidebar[`${prefix}/${a.dir}/`] = group
    for (const p of a.pages ?? []) {
      sidebar[`${prefix}/${p}`] = group
      claimed.add(`${prefix}/${p}`)
    }
  }

  const contribute = [
    { text: CONTRIBUTE.text[locale], link: `${prefix}/${CONTRIBUTE.dir}/`, items: [{ text: t.editingDocs, link: '/editing-these-docs' }] },
    ...SECTIONS.filter((s) => fs.existsSync(path.join(DOCS_ROOT, localeDir(locale, s.dir)))).map((s) => ({
      text: s.text[locale] || s.text.en,
      link: `${prefix}/${s.dir}/`,
      collapsed: true,
      items: itemsFor(localeDir(locale, s.dir), `${prefix}/${s.dir}`, claimed),
    })),
  ]
  sidebar[`${prefix}/${CONTRIBUTE.dir}/`] = contribute
  sidebar['/editing-these-docs'] = contribute
  for (const s of SECTIONS) sidebar[`${prefix}/${s.dir}/`] = contribute
  return sidebar
}

function buildNav(locale) {
  return [...AUDIENCES, CONTRIBUTE].map((a) => ({ text: a.text[locale], link: `${localePrefix(locale)}/${a.dir}/` }))
}

function buildThemeConfig(locale) {
  const t = UI_TEXT[locale]
  return {
    nav: buildNav(locale),
    sidebar: buildSidebar(locale),
    outline: { label: t.outline },
    docFooter: { prev: t.prev, next: t.next },
    darkModeSwitchLabel: t.darkModeSwitchLabel,
    darkModeSwitchTitle: t.darkModeSwitchTitle,
    lightModeSwitchTitle: t.lightModeSwitchTitle,
    sidebarMenuLabel: t.sidebarMenuLabel,
    returnToTopLabel: t.returnToTopLabel,
    langMenuLabel: t.langMenuLabel,
    skipToContentLabel: t.skipToContentLabel,
    // themeConfig is shallow-merged per locale, so `footer` must carry both keys here
    // or a locale override would silently drop the root's copyright line.
    footer: { message: t.footerMessage, copyright: `Copyright © ${new Date().getFullYear()} Schuly` },
  }
}

function buildMarkdownLocale(locale) {
  const t = UI_TEXT[locale]
  return {
    container: {
      tipLabel: t.tipLabel,
      warningLabel: t.warningLabel,
      dangerLabel: t.dangerLabel,
      infoLabel: t.infoLabel,
      detailsLabel: t.detailsLabel,
    },
  }
}

function buildSearchLocales() {
  const locales = {}
  for (const locale of LOCALES) {
    const key = locale === 'en' ? 'root' : locale
    locales[key] = { translations: UI_TEXT[locale].search }
  }
  return locales
}

// VitePress only treats index.md as a folder index; source repos use README.md
// (the GitHub convention). Remap every README.md -> index.md so /<Section>/ resolves.
// Locale-nested sections are picked up automatically since this walks the whole tree.
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

const locales = {}
for (const locale of LOCALES) {
  const key = locale === 'en' ? 'root' : locale
  const t = UI_TEXT[locale]
  locales[key] = {
    label: t.label,
    lang: t.htmlLang,
    title: t.title,
    description: t.description,
    link: `${localePrefix(locale)}/`,
    themeConfig: buildThemeConfig(locale),
    markdown: buildMarkdownLocale(locale),
  }
}

export default withMermaid({
  title: 'Schuly Docs',
  description: 'Documentation for the Schuly project',
  lang: 'en-US',

  // Synced docs carry cross-repo relative links; don't fail the build over them.
  ignoreDeadLinks: true,
  cleanUrls: true,

  rewrites: buildRewrites(),
  locales,

  head: [
    ['link', { rel: 'icon', href: '/img/favicon.ico' }],
    ['meta', { property: 'og:image', content: '/img/social-card.png' }],
  ],

  themeConfig: {
    logo: '/img/logo.png',

    socialLinks: [{ icon: 'github', link: 'https://github.com/schulydev' }],

    search: {
      provider: 'local',
      options: { locales: buildSearchLocales() },
    },

    // footer is fully defined per-locale in buildThemeConfig (shallow merge means a
    // locale's footer object replaces this one wholesale, not merges into it).
    editLink: undefined,
  },
})
