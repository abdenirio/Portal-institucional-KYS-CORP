import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Building2, CircleHelp, FileText, Menu, Moon, Search, Sun, X,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
const tagline = 'Um ecossistema empresarial de soluções, inovação e desenvolvimento.';
const canonicalBaseUrl = 'https://kyscorp.org';
const companies = [
  { name: 'KYS Digital', slug: 'kys-digital' },
  { name: 'KYS Publicidades', slug: 'kys-publicidades' },
  { name: 'KYS Terapias', slug: 'kys-terapias' },
  { name: 'KYS Loja', slug: 'kys-loja' },
  { name: 'KYS Carros', slug: 'kys-carros' },
  { name: 'KYS Imobiliária', slug: 'kys-imobiliaria' },
  { name: 'KYS Media', slug: 'kys-media' },
  { name: 'KYS Sexshop', slug: 'kys-sexshop' },
];
const navigation = [
  { href: '/sobre', label: 'O grupo' },
  { href: '/empresas', label: 'Empresas' },
  { href: '/estrutura', label: 'Estrutura' },
  { href: '/governanca', label: 'Governança' },
  { href: '/publicacoes', label: 'Publicações' },
  { href: '/informacoes', label: 'Informações' },
  { href: '/contactos', label: 'Contactos' },
];
const pending = 'Informação em atualização';

function usePageMeta(title: string, description: string) {
  useEffect(() => {
    const fullTitle = `${title} | Grupo KYS CORP LDA`;
    const canonicalUrl = `${canonicalBaseUrl}${window.location.pathname}`;
    document.title = fullTitle;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
    const setProperty = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };
    setProperty('og:title', fullTitle);
    setProperty('og:description', description);
    setProperty('og:url', canonicalUrl);
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [title, description]);
}

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button className="icon-button" type="button" onClick={onToggle} aria-label={dark ? 'Mudar para tema claro' : 'Mudar para tema escuro'} data-testid="button-theme-toggle">
      {dark ? <Sun size={16} strokeWidth={1.7} /> : <Moon size={16} strokeWidth={1.7} />}
    </button>
  );
}

function Header({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [location]);
  const active = (href: string) => location === href || (href === '/empresas' && location.startsWith('/empresas/'));
  return (
    <header className="topbar">
      <div className="wrap header-inner">
        <Link href="/" className="wordmark" aria-label="Grupo KYS CORP LDA — página inicial" data-testid="link-brand-home">
          <span className="wordmark-mark" aria-hidden="true">KYS</span>
          <span className="wordmark-text">GRUPO KYS CORP<small>LDA · PORTAL INSTITUCIONAL</small></span>
        </Link>
        <nav className="nav-links" aria-label="Navegação principal">
          {navigation.map((item) => <Link key={item.href} href={item.href} className={`nav-link${active(item.href) ? ' active' : ''}`} data-testid={`link-nav-${item.href.slice(1)}`}>{item.label}</Link>)}
        </nav>
        <div className="header-actions">
          <ThemeToggle dark={dark} onToggle={onToggle} />
          <button className="menu-button" type="button" onClick={() => setOpen(!open)} aria-label={open ? 'Fechar navegação' : 'Abrir navegação'} aria-expanded={open} data-testid="button-mobile-menu">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open && <nav className="mobile-nav" aria-label="Navegação móvel">{navigation.map((item) => <Link key={item.href} href={item.href} className={`nav-link${active(item.href) ? ' active' : ''}`} data-testid={`mobile-link-${item.href.slice(1)}`}>{item.label}</Link>)}</nav>}
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <Link href="/" className="wordmark" data-testid="link-footer-home">
            <span className="wordmark-mark" aria-hidden="true">KYS</span>
            <span className="wordmark-text">GRUPO KYS CORP<small>LDA · PORTAL INSTITUCIONAL</small></span>
          </Link>
          <nav className="footer-links" aria-label="Navegação de rodapé">
            {navigation.map((item) => <Link key={item.href} href={item.href} data-testid={`footer-link-${item.href.slice(1)}`}>{item.label}</Link>)}
          </nav>
        </div>
        <div className="footer-bottom"><span>Grupo KYS CORP LDA</span><span>Conteúdo institucional em atualização.</span></div>
      </div>
    </footer>
  );
}

function SiteLayout({ children, dark, onToggle }: { children: ReactNode; dark: boolean; onToggle: () => void }) {
  return <div className="site-shell"><a className="skip-link" href="#main-content">Saltar para o conteúdo</a><Header dark={dark} onToggle={onToggle} /><main id="main-content">{children}</main><Footer /></div>;
}

function Eyebrow({ children }: { children: ReactNode }) { return <span className="eyebrow">{children}</span>; }

function PageHero({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) {
  return <section className="page-hero"><div className="wrap fade-in"><Eyebrow>{eyebrow}</Eyebrow><h1 className="page-title">{title}</h1><p className="page-lead" data-testid="text-page-intro">{lead}</p></div></section>;
}

function StatusBand({ title = pending, detail = 'Os dados institucionais correspondentes serão disponibilizados neste espaço.' }: { title?: string; detail?: string }) {
  return <div className="status-band" data-testid="status-information-update"><div><span className="status-pill">{title}</span><p>{detail}</p></div><FileText size={19} strokeWidth={1.4} aria-hidden="true" /></div>;
}

function Home() {
  usePageMeta('Início', tagline);
  return (
    <div className="fade-in">
      <section className="wrap hero">
        <div className="hero-copy">
          <Eyebrow>Portal institucional · Grupo KYS CORP LDA</Eyebrow>
          <h1 className="hero-title">Um grupo.<br /><span>Muitas possibilidades.</span></h1>
          <p className="hero-subtitle" data-testid="text-tagline">{tagline}</p>
          <div className="hero-actions">
            <Link href="/empresas" className="button-primary" data-testid="link-explore-companies">Explorar empresas <ArrowUpRight size={16} /></Link>
            <Link href="/sobre" className="text-link" data-testid="link-about-group">Conhecer o grupo <ArrowRight size={15} /></Link>
          </div>
        </div>
        <div className="hero-art" role="img" aria-label="Representação gráfica do grupo e dos nomes de empresas inicialmente indicados">
          <div className="orbit-art">
            <div className="orbit-center">KYS<small>CORP LDA</small></div>
            {companies.slice(0, 6).map((company, i) => <span className={`orbit-node n${i + 1}`} key={company.slug}>{company.name.replace('KYS ', '')}</span>)}
            <span className="orbit-label">Um ecossistema em formação</span>
          </div>
        </div>
      </section>
      <div className="ticker"><div className="wrap ticker-inner"><span>Visão de grupo</span><span className="ticker-dot" /><span>Estrutura empresarial</span><span className="ticker-dot" /><span>Transparência institucional</span><span className="ticker-dot" /><span>Informação pública</span></div></div>
      <section className="section wrap">
        <div className="section-head">
          <div><Eyebrow>01 / Presença empresarial</Eyebrow><h2 className="section-title">Um ponto de partida<br />para conhecer o grupo.</h2></div>
          <div><p className="section-intro">Os nomes abaixo foram indicados para este portal. Os respetivos perfis serão completados quando houver informação institucional validada.</p><Link href="/empresas" className="text-link" style={{ marginTop: 20 }} data-testid="link-all-companies">Ver diretório completo <ArrowRight size={14} /></Link></div>
        </div>
        <div className="company-list">
          {companies.slice(0, 4).map((company, i) => <Link className="company-row" href={`/empresas/${company.slug}`} key={company.slug} data-testid={`company-row-home-${company.slug}`}><span className="company-index">0{i + 1}</span><span className="company-name">{company.name}</span><span className="status-pill">{pending}</span><ArrowUpRight className="row-arrow" size={17} /></Link>)}
        </div>
      </section>
      <section className="dark-panel">
        <div className="wrap values-layout">
          <div className="values-copy"><Eyebrow>02 / Identidade institucional</Eyebrow><h2 className="section-title">Uma base comum.<br />Informação clara.</h2><p className="section-intro" style={{ marginTop: 20 }}>Este portal reúne informação institucional pública do Grupo KYS CORP LDA. Conteúdos ainda não disponibilizados são assinalados com transparência.</p><Link href="/informacoes" className="button-secondary" style={{ marginTop: 25, borderColor: 'var(--line)' }} data-testid="link-institutional-info">Consultar informações <ArrowUpRight size={15} /></Link></div>
          <div className="value-stack">
            {['Propósito', 'Missão', 'Visão', 'Valores'].map((label, i) => <div className="value-item" key={label}><span className="value-num">0{i + 1}</span><div><h3>{label}</h3><p>{pending}. A informação institucional aprovada será publicada nesta secção.</p></div></div>)}
          </div>
        </div>
      </section>
      <section className="section wrap">
        <div className="section-head"><div><Eyebrow>03 / Acesso público</Eyebrow><h2 className="section-title">Um portal aberto<br />à consulta.</h2></div><p className="section-intro">Explore a estrutura, consulte futuras publicações ou encontre informação geral sobre o grupo.</p></div>
        <div className="info-grid">
          {[{ title: 'Estrutura', href: '/estrutura', text: 'Consulte a representação institucional disponível.' }, { title: 'Governança', href: '/governanca', text: 'Aceda a informação de governança e documentos futuros.' }, { title: 'Publicações', href: '/publicacoes', text: 'Pesquise conteúdos quando forem publicados.' }, { title: 'Contactos', href: '/contactos', text: 'Conheça os canais de contacto previstos.' }].map((item, i) => <Link href={item.href} className="info-cell" key={item.href} style={{ textDecoration: 'none', color: 'inherit' }} data-testid={`home-access-${item.href.slice(1)}`}><Eyebrow>0{i + 1} / Explorar</Eyebrow><h3 style={{ font: '600 20px Manrope', margin: '16px 0 0' }}>{item.title} <ArrowUpRight size={15} style={{ verticalAlign: 'middle' }} /></h3><p>{item.text}</p></Link>)}
        </div>
      </section>
    </div>
  );
}

function About() {
  usePageMeta('Sobre o grupo', 'Enquadramento institucional do Grupo KYS CORP LDA.');
  return <>
    <PageHero eyebrow="O grupo / enquadramento" title="Sobre o grupo" lead="Uma apresentação institucional do Grupo KYS CORP LDA. Os conteúdos ainda não confirmados são assinalados de forma explícita." />
    <section className="content-section wrap">
      <div className="split-content"><h2>Uma identidade em construção pública.</h2><div className="body-copy"><p>O Grupo KYS CORP LDA apresenta-se através deste portal como um ecossistema empresarial de soluções, inovação e desenvolvimento.</p><p>Este espaço está a ser preparado para reunir informação pública, documentos e referências institucionais. Não são apresentados dados que ainda não tenham sido disponibilizados.</p><StatusBand /></div></div>
    </section>
    <section className="content-section" style={{ background: 'var(--soft)' }}><div className="wrap"><div className="section-head"><div><Eyebrow>Princípios institucionais</Eyebrow><h2 className="section-title">O que orienta<br />o grupo.</h2></div><p className="section-intro">Propósito, missão, visão e valores oficiais aguardam publicação.</p></div><div className="info-grid">{['Propósito', 'Missão', 'Visão', 'Valores'].map((title) => <div className="info-cell" key={title}><Eyebrow>{pending}</Eyebrow><h3 style={{ font: '600 20px Manrope', margin: '14px 0 0' }}>{title}</h3><p>Conteúdo institucional a disponibilizar.</p></div>)}</div></div></section>
    <section className="content-section wrap"><div className="split-content"><h2>Percurso institucional</h2><div><p className="body-copy">A cronologia será apresentada quando os marcos e respetivas datas forem confirmados.</p><div className="timeline" data-testid="timeline-empty"><div className="timeline-row"><span>Histórico</span><span>{pending}</span></div><div className="timeline-row"><span>Marcos</span><span>Não existem marcos publicados.</span></div></div></div></div></section>
  </>;
}

function Companies() {
  usePageMeta('Empresas', 'Diretório dos nomes de empresas indicados para o Grupo KYS CORP LDA.');
  const [search, setSearch] = useState('');
  const [letter, setLetter] = useState('Todas');
  const letters = ['Todas', 'A–C', 'D–K', 'L–R', 'S–Z'];
  const results = useMemo(() => companies.filter((company) => {
    const cleanName = company.name.replace('KYS ', '');
    const matchesLetter = letter === 'Todas'
      || (letter === 'A–C' && /^[A-C]/i.test(cleanName))
      || (letter === 'D–K' && /^[D-K]/i.test(cleanName))
      || (letter === 'L–R' && /^[L-R]/i.test(cleanName))
      || (letter === 'S–Z' && /^[S-Z]/i.test(cleanName));
    return company.name.toLocaleLowerCase('pt').includes(search.toLocaleLowerCase('pt')) && matchesLetter;
  }), [search, letter]);
  return <>
    <PageHero eyebrow="Empresas / diretório" title="Empresas do grupo" lead="Consulte os nomes inicialmente indicados. A inclusão no diretório não representa uma declaração de atividade, estrutura acionista ou perfil operacional." />
    <section className="content-section wrap">
      <div className="directory-tools">
        <label className="search-box"><Search size={16} /><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar por nome" aria-label="Pesquisar empresas" data-testid="input-company-search" /></label>
        <label style={{ fontSize: 11, color: 'var(--muted-ink)' }} htmlFor="company-filter">Filtrar pelo nome</label>
        <select id="company-filter" className="filter-select" value={letter} onChange={(e) => setLetter(e.target.value)} data-testid="select-company-filter">{letters.map((v) => <option key={v}>{v}</option>)}</select>
      </div>
      <p style={{ color: 'var(--muted-ink)', fontSize: 11, marginBottom: 16 }} data-testid="text-company-count">{results.length} {results.length === 1 ? 'nome' : 'nomes'} no diretório</p>
      {results.length ? <div className="directory-grid">{results.map((company, i) => <Link className="directory-card" href={`/empresas/${company.slug}`} key={company.slug} data-testid={`company-card-${company.slug}`}><div className="directory-card-top"><span className="company-index">{String(companies.indexOf(company) + 1).padStart(2, '0')} / 08</span><ArrowUpRight size={17} /></div><div><h2>{company.name}</h2><p>{pending}</p></div></Link>)}</div> : <div className="empty-state" data-testid="empty-company-results">Não foram encontrados nomes para esta pesquisa. Experimente outro termo ou filtro.</div>}
      <StatusBand detail="Os perfis individuais serão atualizados quando houver conteúdos confirmados para publicação." />
    </section>
  </>;
}

function CompanyDetail({ params }: { params: { slug?: string } }) {
  const company = companies.find((item) => item.slug === params.slug);
  usePageMeta(company?.name ?? 'Empresa', `Informação institucional sobre ${company?.name ?? 'a empresa indicada'}.`);
  if (!company) return <NotFound />;
  return <>
    <section className="page-hero"><div className="wrap fade-in"><div className="detail-top"><Link href="/empresas" className="text-link" style={{ border: 0 }} data-testid="link-back-companies"><ArrowLeft size={14} /> Empresas</Link><span>/</span><span>Perfil</span></div><Eyebrow>Diretório de empresas</Eyebrow><h1 className="page-title">{company.name}</h1><p className="page-lead">Perfil institucional</p></div></section>
    <section className="content-section wrap"><div className="detail-panel"><span className="status-pill">{pending}</span><h2 style={{ marginTop: 23 }}>Perfil em preparação</h2><p className="body-copy">Não foram disponibilizadas informações institucionais adicionais sobre esta entidade. Este perfil será atualizado quando existirem conteúdos confirmados para publicação.</p></div><div className="fact-table" style={{ marginTop: 50 }}><dl className="fact-row"><dt>Nome indicado</dt><dd>{company.name}</dd></dl><dl className="fact-row"><dt>Descrição</dt><dd>{pending}</dd></dl><dl className="fact-row"><dt>Informação de contacto</dt><dd>{pending}</dd></dl></div></section>
  </>;
}

function Structure() {
  usePageMeta('Estrutura', 'Representação institucional com os nomes confirmados para o portal.');
  return <>
    <PageHero eyebrow="Estrutura / representação" title="Estrutura do grupo" lead="Representação visual dos nomes indicados para este portal. Esta apresentação não constitui declaração de participação, propriedade ou relação acionista." />
    <section className="content-section wrap"><div className="org-tree" data-testid="organization-chart"><div className="org-parent">Grupo KYS CORP LDA<small>Nome institucional confirmado</small></div><div className="tree-line" /><div className="org-list">{companies.map((c) => <div className="org-node" key={c.slug} data-testid={`org-node-${c.slug}`}>{c.name}</div>)}</div><p className="org-note">Os nomes são apresentados como elementos do diretório inicialmente fornecido. A configuração jurídica e organizacional não foi publicada.</p></div><StatusBand title={pending} detail="Não foram fornecidos dados sobre relações de propriedade, administração ou participação entre as entidades." /></section>
  </>;
}

function Governance() {
  usePageMeta('Governança', 'Informação pública de governança e documentos do Grupo KYS CORP LDA.');
  return <>
    <PageHero eyebrow="Governança / transparência" title="Governança" lead="Esta área será dedicada à informação pública de governança, enquadramento e documentos institucionais." />
    <section className="content-section wrap"><div className="split-content"><h2>Informação pública</h2><div><p className="body-copy">Os detalhes de governança ainda não foram disponibilizados. Não são aqui inferidos órgãos, representantes, políticas ou enquadramentos legais.</p><StatusBand /></div></div></section>
    <section className="content-section" style={{ background: 'var(--soft)' }}><div className="wrap"><div className="section-head"><div><Eyebrow>Documentos</Eyebrow><h2 className="section-title">Referências para consulta.</h2></div><p className="section-intro">Os documentos oficiais serão apresentados após validação e publicação.</p></div><div className="document-list">{['Estatutos e documentação societária', 'Políticas institucionais', 'Relatórios e informação pública'].map((label) => <div className="document-row" key={label}><div><strong>{label}</strong><br /><small>{pending}</small></div><FileText size={17} /></div>)}</div></div></section>
  </>;
}

function Publications() {
  usePageMeta('Publicações', 'Pesquisa de publicações institucionais do Grupo KYS CORP LDA.');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas as categorias');
  const [submitted, setSubmitted] = useState(false);
  function onSearch(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setSubmitted(true); }
  return <>
    <PageHero eyebrow="Publicações / arquivo" title="Publicações" lead="Pesquise comunicados, documentos e outros conteúdos institucionais. Ainda não existem publicações disponibilizadas neste portal." />
    <section className="content-section wrap"><form className="publication-tools" onSubmit={onSearch} role="search">
      <label className="search-box"><Search size={16} /><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar publicações" aria-label="Pesquisar publicações" data-testid="input-publication-search" /></label>
      <select className="filter-select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filtrar por categoria" data-testid="select-publication-category"><option>Todas as categorias</option><option>Comunicados</option><option>Documentos</option><option>Notícias</option></select>
      <button className="button-primary" type="submit" data-testid="button-search-publications">Pesquisar <ArrowRight size={14} /></button>
    </form><div className="empty-state" data-testid="empty-publications"><FileText size={20} style={{ marginBottom: 15 }} /><strong style={{ display: 'block', color: 'var(--ink)', font: '600 17px Manrope', marginBottom: 7 }}>Ainda sem publicações</strong>{submitted && (search || category !== 'Todas as categorias') ? 'A pesquisa foi aplicada. Não existem conteúdos publicados que correspondam aos critérios.' : 'Quando existirem conteúdos institucionais publicados, serão apresentados aqui.'}</div></section>
  </>;
}

function Information() {
  usePageMeta('Informações', 'Ficha institucional e recursos públicos do Grupo KYS CORP LDA.');
  const facts = [['Denominação indicada', 'Grupo KYS CORP LDA'], ['Tagline', tagline], ['Nomes empresariais fornecidos', `${companies.length} nomes indicados`], ['Sede e morada', pending], ['Contacto institucional', pending], ['Dados legais e registo', pending], ['História institucional', pending]];
  return <>
    <PageHero eyebrow="Informações / ficha institucional" title="Informações" lead="Factos confirmados para este portal e recursos públicos disponíveis. Os campos não fornecidos permanecem assinalados." />
    <section className="content-section wrap"><Eyebrow>Ficha institucional</Eyebrow><dl className="fact-table" style={{ marginTop: 20 }} data-testid="institutional-facts">{facts.map(([term, value], i) => <div className="fact-row" key={term} data-testid={`fact-row-${i}`}><dt>{term}</dt><dd>{value}</dd></div>)}</dl></section>
    <section className="content-section" style={{ background: 'var(--soft)' }}><div className="wrap"><div className="section-head"><div><Eyebrow>Recursos</Eyebrow><h2 className="section-title">Consulta pública.</h2></div><p className="section-intro">Materiais de referência serão adicionados quando disponibilizados.</p></div><div className="info-grid">{[{ icon: FileText, title: 'Documentos públicos' }, { icon: CircleHelp, title: 'Perguntas frequentes' }, { icon: Building2, title: 'Recursos para imprensa' }, { icon: ArrowUpRight, title: 'Identidade e marca' }].map(({ icon: Icon, title }) => <div className="info-cell" key={title}><Icon size={17} strokeWidth={1.5} /><h3 style={{ font: '600 16px Manrope', margin: '16px 0 0' }}>{title}</h3><p>{pending}</p></div>)}</div></div></section>
  </>;
}

function Contacts() {
  usePageMeta('Contactos', 'Categorias de contacto e formulário institucional do Grupo KYS CORP LDA.');
  return <>
    <PageHero eyebrow="Contactos / comunicação" title="Contactos" lead="Este espaço apresenta as categorias de contacto previstas. Os dados de contacto ainda não foram publicados." />
    <section className="content-section wrap"><div className="contact-layout"><div><Eyebrow>Canais institucionais</Eyebrow><h2 className="section-title" style={{ fontSize: 34 }}>Fale com a equipa.</h2><p className="body-copy">Os canais oficiais serão publicados quando estiverem disponíveis.</p><div className="contact-categories">{['Informação geral', 'Imprensa e comunicação', 'Parcerias', 'Outros assuntos'].map((item) => <div className="contact-category" key={item}><span>{item}</span><span className="status-pill">{pending}</span></div>)}</div><StatusBand title="Contactos não publicados" detail="Não estão disponíveis endereço, telefone ou correio eletrónico institucional." /></div>
      <form className="contact-form" onSubmit={(e) => e.preventDefault()} data-testid="form-contact">
        <Eyebrow>Formulário de contacto</Eyebrow>
        <label>Nome<input name="name" type="text" autoComplete="name" placeholder="O seu nome" data-testid="input-contact-name" /></label>
        <label>Correio eletrónico<input name="email" type="email" autoComplete="email" placeholder="nome@exemplo.com" data-testid="input-contact-email" /></label>
        <label>Assunto<select name="subject" defaultValue="" data-testid="select-contact-subject"><option value="" disabled>Selecione uma categoria</option><option>Informação geral</option><option>Imprensa e comunicação</option><option>Parcerias</option><option>Outro assunto</option></select></label>
        <label>Mensagem<textarea name="message" placeholder="Escreva a sua mensagem" data-testid="textarea-contact-message" /></label>
        <button className="button-primary" type="button" disabled style={{ opacity: .55, cursor: 'not-allowed' }} data-testid="button-contact-submit">Envio ainda não disponível <ArrowRight size={14} /></button>
        <p className="form-note">O formulário é apresentado como interface demonstrativa. Não existe um canal de envio configurado e nenhuma mensagem será transmitida.</p>
      </form>
    </div></section>
  </>;
}

function CustomNotFound() {
  usePageMeta('Página não encontrada', 'A página solicitada não foi encontrada no portal Grupo KYS CORP LDA.');
  return <section className="wrap not-found"><Eyebrow>Erro 404 / página não encontrada</Eyebrow><h1 className="page-title">Este endereço<br />não existe.</h1><p className="page-lead">O conteúdo pode ter sido movido ou ainda não está disponível.</p><Link href="/" className="button-primary" style={{ marginTop: 24 }} data-testid="link-not-found-home">Voltar à página inicial <ArrowRight size={15} /></Link></section>;
}

function Router() {
  return <RoutedErrorBoundary><Switch>
    <Route path="/" component={Home} />
    <Route path="/sobre" component={About} />
    <Route path="/empresas" component={Companies} />
    <Route path="/empresas/:slug">{(params) => <CompanyDetail params={params} />}</Route>
    <Route path="/estrutura" component={Structure} />
    <Route path="/governanca" component={Governance} />
    <Route path="/publicacoes" component={Publications} />
    <Route path="/informacoes" component={Information} />
    <Route path="/contactos" component={Contacts} />
    <Route component={CustomNotFound} />
  </Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('kyscorp-theme') === 'dark'; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('kyscorp-theme', dark ? 'dark' : 'light'); } catch { /* Storage is optional. */ }
  }, [dark]);
  const toggleTheme = () => setDark((value) => !value);
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><SiteLayout dark={dark} onToggle={toggleTheme}><Router /></SiteLayout></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
