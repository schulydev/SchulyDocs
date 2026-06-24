import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import {
  Smartphone,
  Server,
  Globe,
  KeyRound,
  Puzzle,
  Plug,
} from 'lucide-react';

const SECTIONS = [
  {
    Icon: Smartphone,
    title: 'Mobile app (Schuly)',
    text: 'Flutter app, account vs private modes, the generated API client.',
    to: '/docs/Schuly/',
  },
  {
    Icon: Server,
    title: 'Backend (.NET API)',
    text: 'API architecture, migrations, plugin management, configuration.',
    to: '/docs/SchulyBackend/',
  },
  {
    Icon: Globe,
    title: 'Website',
    text: 'Marketing site architecture, development and deployment.',
    to: '/docs/SchulyWebsite/',
  },
  {
    Icon: KeyRound,
    title: 'Keycloak (auth)',
    text: 'Realm and theme management, auth setup and releases.',
    to: '/docs/SchulyKeycloak/',
  },
  {
    Icon: Puzzle,
    title: 'Plugin abstractions',
    text: 'The plugin contract and versioning rules.',
    to: '/docs/SchulyPluginAbstractions/',
  },
  {
    Icon: Plug,
    title: 'Plugins',
    text: 'Building, distributing and migrating plugins.',
    to: '/docs/SchulyPlugins/',
  },
];

function Hero() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className="heroBanner">
      <div className="heroGrid" />
      <div className="heroGlow" />
      <div className="container heroContent">
        <img className="heroLogo" src={useBaseUrl('/img/logo.png')} alt="Schuly" />
        <h1 className="heroTitle">{siteConfig.title}</h1>
        <p className="heroSubtitle">{siteConfig.tagline}</p>
        <div className="heroButtons">
          <Link className="button button--lg button--hero" to="/docs/">
            Browse the docs
          </Link>
          <Link
            className="button button--lg button--hero-outline"
            to="https://github.com/schulydev"
          >
            GitHub org
          </Link>
        </div>
      </div>
    </header>
  );
}

function Sections() {
  return (
    <section className="container">
      <div className="cards">
        {SECTIONS.map(({ Icon, title, text, to }) => (
          <Link key={to} className="card" to={to}>
            <Icon className="cardIcon" size={28} strokeWidth={1.75} aria-hidden />
            <h2 className="cardTitle">{title}</h2>
            <p className="cardText">{text}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title="Home" description={siteConfig.tagline}>
      <Hero />
      <main>
        <Sections />
      </main>
    </Layout>
  );
}
