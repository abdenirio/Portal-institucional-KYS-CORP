import { type FormEvent, type ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useClerk } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowUpRight, Building2, Check, ChevronRight, FileText, Inbox, LogOut, Plus, RefreshCw, X,
} from 'lucide-react';
import {
  getGetAdminOverviewQueryKey, getGetPublicCompanyQueryKey, getGetPublicationsBySlugQueryKey,
  getListAdminCompaniesQueryKey, getListAdminInquiriesQueryKey, getListAdminPublicationsQueryKey,
  getListPublicCompaniesQueryKey, getListPublicationsQueryKey,
  useGetAdminOverview, useGetAdminSession, useListAdminCompanies, useCreateAdminCompany,
  useUpdateAdminCompany, useArchiveAdminCompany, useListAdminPublications, useCreateAdminPublication,
  useUpdateAdminPublication, useArchiveAdminPublication, useListAdminInquiries, useUpdateAdminInquiry,
} from '@workspace/api-client-react';
import type { Company, Publication, ContactInquiry } from '@workspace/api-client-react';

const nav = [
  { href: '/admin', label: 'Visão geral', icon: Building2 },
  { href: '/admin/empresas', label: 'Empresas', icon: Building2 },
  { href: '/admin/publicacoes', label: 'Publicações', icon: FileText },
  { href: '/admin/contactos', label: 'Contactos', icon: Inbox },
];

function AdminFrame({ children, title, kicker }: { children: ReactNode; title: string; kicker: string }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Link href="/" className="admin-brand" data-testid="link-admin-brand"><span className="wordmark-mark">KYS</span><span>PORTAL<small>GESTÃO INSTITUCIONAL</small></span></Link>
      <div className="admin-nav-label">Área privada</div>
      <nav aria-label="Navegação de administração">{nav.map(({ href, label, icon: Icon }) => <Link href={href} key={href} className={`admin-nav-item${location === href ? ' active' : ''}`} data-testid={`link-admin-${href.split('/').pop() || 'overview'}`}><Icon size={16} strokeWidth={1.6} />{label}<ChevronRight size={14} /></Link>)}</nav>
      <div className="admin-sidebar-bottom"><Link href="/" className="admin-return" data-testid="link-return-public"><ArrowLeft size={15} /> Portal público</Link><button type="button" className="admin-signout" onClick={() => signOut({ redirectUrl: '/' })} data-testid="button-admin-signout"><LogOut size={15} /> Terminar sessão</button></div>
    </aside>
    <main className="admin-main">
      <header className="admin-topline"><span>Grupo KYS CORP LDA <span className="admin-separator">/</span> Gestão de conteúdos</span><span className="private-mark">ACESSO PRIVADO</span></header>
      <div className="admin-page-head"><div><span className="admin-kicker">{kicker}</span><h1>{title}</h1></div><Link href="/" className="admin-view-public" data-testid="link-admin-view-public">Ver portal público <ArrowUpRight size={15} /></Link></div>
      {children}
    </main>
  </div>;
}

function LoadingPanel({ label }: { label: string }) {
  return <div className="admin-loading" aria-busy="true"><span /><span /><span /><p>A carregar {label}…</p></div>;
}

function ErrorPanel({ text, retry }: { text: string; retry: () => void }) {
  return <div className="admin-notice error" role="alert" data-testid="admin-error"><span>{text}</span><button type="button" onClick={retry} data-testid="button-admin-retry"><RefreshCw size={14} /> Tentar novamente</button></div>;
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <div className="admin-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function Overview() {
  const query = useGetAdminOverview();
  if (query.isLoading) return <LoadingPanel label="indicadores" />;
  if (query.isError || !query.data) return <ErrorPanel text="Os indicadores não estão disponíveis." retry={() => query.refetch()} />;
  const summary = query.data;
  return <><div className="admin-metrics" data-testid="admin-overview-metrics"><Metric label="Empresas" value={summary.companies} detail="Perfis no diretório" /><Metric label="Publicações" value={summary.publications} detail="Conteúdos publicados" /><Metric label="Em rascunho" value={summary.drafts} detail="A aguardar revisão" /><Metric label="Novos contactos" value={summary.newInquiries} detail="Mensagens por rever" /></div>
    <section className="admin-welcome"><div><span className="admin-kicker">Espaço editorial</span><h2>Informação institucional, sob controlo.</h2><p>Crie e mantenha perfis, publicações e pedidos de contacto do portal.</p></div><div className="admin-shortcuts">{nav.slice(1).map(({ href, label, icon: Icon }) => <Link href={href} key={href} data-testid={`shortcut-admin-${href.split('/').pop()}`}><Icon size={17} />{label}<ArrowUpRight size={14} /></Link>)}</div></section></>;
}

function EditDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="admin-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title"><header><div><span className="admin-kicker">Editor de conteúdo</span><h2 id="admin-modal-title">{title}</h2></div><button type="button" className="admin-icon-button" onClick={onClose} aria-label="Fechar editor" data-testid="button-close-editor"><X size={17} /></button></header>{children}</section>
  </div>;
}

function CompanyEditor({ initial, onClose, onSaved }: { initial?: Company; onClose: () => void; onSaved: (message: string) => void }) {
  const client = useQueryClient();
  const create = useCreateAdminCompany();
  const update = useUpdateAdminCompany();
  const isPending = create.isPending || update.isPending;
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get('name')).trim(), slug: String(form.get('slug')).trim(),
      description: String(form.get('description') || '') || null, sector: String(form.get('sector') || '') || null,
      services: String(form.get('services') || '') || null, logoUrl: String(form.get('logoUrl') || '') || null,
      officialWebsite: String(form.get('officialWebsite') || '') || null,
      status: String(form.get('status')) as 'draft' | 'published' | 'archived',
      sortOrder: Number(form.get('sortOrder') || 0), seoTitle: String(form.get('seoTitle') || '') || null,
      seoDescription: String(form.get('seoDescription') || '') || null,
    };
    const done = () => {
      client.invalidateQueries({ queryKey: getListAdminCompaniesQueryKey() });
      client.invalidateQueries({ queryKey: getListPublicCompaniesQueryKey() });
      client.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() });
      if (initial) client.invalidateQueries({ queryKey: getGetPublicCompanyQueryKey(initial.slug) });
      onSaved(initial ? 'Perfil atualizado com sucesso.' : 'Perfil criado com sucesso.');
      onClose();
    };
    if (initial) update.mutate({ id: initial.id, data: payload }, { onSuccess: done });
    else create.mutate({ data: payload }, { onSuccess: done });
  }
  return <EditDialog title={initial ? 'Editar perfil' : 'Novo perfil'} onClose={onClose}><form className="admin-form" onSubmit={submit}>
    <div className="admin-form-grid"><label>Nome da empresa<input required maxLength={120} name="name" defaultValue={initial?.name} data-testid="input-company-name" /></label><label>Identificador URL<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" name="slug" defaultValue={initial?.slug} data-testid="input-company-slug" /></label>
      <label>Sector<input maxLength={120} name="sector" defaultValue={initial?.sector ?? ''} data-testid="input-company-sector" /></label><label>Ordem no diretório<input type="number" name="sortOrder" defaultValue={initial?.sortOrder ?? 0} data-testid="input-company-sort-order" /></label>
      <label>Website oficial<input type="url" name="officialWebsite" defaultValue={initial?.officialWebsite ?? ''} data-testid="input-company-website" /></label><label>URL do logótipo<input type="url" name="logoUrl" defaultValue={initial?.logoUrl ?? ''} data-testid="input-company-logo" /></label>
      <label>Estado<select name="status" defaultValue={initial?.status ?? 'draft'} data-testid="select-company-status"><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label>
      <label className="admin-span-two">Descrição<textarea maxLength={5000} rows={4} name="description" defaultValue={initial?.description ?? ''} data-testid="textarea-company-description" /></label>
      <label className="admin-span-two">Serviços<textarea maxLength={3000} rows={3} name="services" defaultValue={initial?.services ?? ''} data-testid="textarea-company-services" /></label>
      <label>SEO · título<input maxLength={160} name="seoTitle" defaultValue={initial?.seoTitle ?? ''} data-testid="input-company-seo-title" /></label><label>SEO · descrição<input maxLength={320} name="seoDescription" defaultValue={initial?.seoDescription ?? ''} data-testid="input-company-seo-description" /></label>
    </div><div className="admin-form-actions"><button type="button" className="admin-button secondary" onClick={onClose} data-testid="button-company-cancel">Cancelar</button><button type="submit" className="admin-button primary" disabled={isPending} data-testid="button-company-save">{isPending ? 'A guardar…' : 'Guardar perfil'}</button></div>
    {(create.isError || update.isError) && <p className="admin-inline-error" role="alert">Não foi possível guardar o perfil. Verifique os campos e tente novamente.</p>}
  </form></EditDialog>;
}

function CompaniesAdmin() {
  const client = useQueryClient();
  const query = useListAdminCompanies();
  const archive = useArchiveAdminCompany();
  const [editing, setEditing] = useState<Company | null | undefined>(undefined);
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('all');
  const companies = (query.data ?? []).filter((c) => filter === 'all' || c.status === filter);
  function archiveCompany(company: Company) {
    if (!window.confirm(`Arquivar o perfil “${company.name}”?`)) return;
    archive.mutate({ id: company.id }, { onSuccess: () => {
      client.invalidateQueries({ queryKey: getListAdminCompaniesQueryKey() });
      client.invalidateQueries({ queryKey: getListPublicCompaniesQueryKey() });
      client.invalidateQueries({ queryKey: getGetPublicCompanyQueryKey(company.slug) });
      client.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() });
      setNotice('Perfil arquivado com sucesso.');
    } });
  }
  return <><div className="admin-toolbar"><p>Gira os perfis de empresa e a sua visibilidade no portal público.</p><div className="admin-toolbar-actions"><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrar empresas por estado" data-testid="filter-company-status"><option value="all">Todos os estados</option><option value="draft">Rascunhos</option><option value="published">Publicados</option><option value="archived">Arquivados</option></select><button className="admin-button primary" type="button" onClick={() => setEditing(null)} data-testid="button-create-company"><Plus size={15} /> Novo perfil</button></div></div>
    {notice && <div className="admin-notice success" role="status" data-testid="status-company-success"><Check size={16} />{notice}<button type="button" onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={14} /></button></div>}
    {query.isLoading ? <LoadingPanel label="perfis de empresas" /> : query.isError ? <ErrorPanel text="Não foi possível carregar os perfis." retry={() => query.refetch()} /> : companies.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Empresa</th><th>Sector</th><th>Estado</th><th>Actualizado</th><th><span className="sr-only">Acções</span></th></tr></thead><tbody>{companies.map((company) => <tr key={company.id}><td><strong>{company.name}</strong><small>/{company.slug}</small></td><td>{company.sector || '—'}</td><td><span className={`admin-status ${company.status}`}>{company.status}</span></td><td>{new Date(company.updatedAt).toLocaleDateString('pt-PT')}</td><td className="admin-row-actions"><button type="button" onClick={() => setEditing(company)} data-testid={`button-edit-company-${company.id}`}>Editar</button>{company.status !== 'archived' && <button type="button" onClick={() => archiveCompany(company)} disabled={archive.isPending} data-testid={`button-archive-company-${company.id}`}>Arquivar</button>}</td></tr>)}</tbody></table></div> : <div className="admin-empty"><Building2 size={22} /><strong>Nenhum perfil encontrado</strong><span>Crie o primeiro perfil ou altere o filtro de estado.</span></div>}
    {archive.isError && <p className="admin-inline-error" role="alert">O perfil não foi arquivado. Tente novamente.</p>}
    {editing !== undefined && <CompanyEditor initial={editing || undefined} onClose={() => setEditing(undefined)} onSaved={setNotice} />}
  </>;
}

function PublicationEditor({ initial, onClose, onSaved }: { initial?: Publication; onClose: () => void; onSaved: (message: string) => void }) {
  const client = useQueryClient();
  const create = useCreateAdminPublication();
  const update = useUpdateAdminPublication();
  const isPending = create.isPending || update.isPending;
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const publishedInput = String(form.get('publishedAt') || '');
    const payload = {
      title: String(form.get('title')).trim(), slug: String(form.get('slug')).trim(),
      imageUrl: String(form.get('imageUrl') || '') || null, author: String(form.get('author') || '') || null,
      category: String(form.get('category')).trim(), content: String(form.get('content')).trim(),
      status: String(form.get('status')) as 'draft' | 'published' | 'archived',
      publishedAt: publishedInput ? new Date(publishedInput).toISOString() : null,
      seoTitle: String(form.get('seoTitle') || '') || null, seoDescription: String(form.get('seoDescription') || '') || null,
    };
    const done = () => {
      client.invalidateQueries({ queryKey: getListAdminPublicationsQueryKey() });
      client.invalidateQueries({ queryKey: getListPublicationsQueryKey() });
      client.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() });
      if (initial) client.invalidateQueries({ queryKey: getGetPublicationsBySlugQueryKey(initial.slug) });
      onSaved(initial ? 'Publicação atualizada com sucesso.' : 'Publicação criada com sucesso.');
      onClose();
    };
    if (initial) update.mutate({ id: initial.id, data: payload }, { onSuccess: done });
    else create.mutate({ data: payload }, { onSuccess: done });
  }
  const dateValue = initial?.publishedAt ? new Date(initial.publishedAt).toISOString().slice(0, 16) : '';
  return <EditDialog title={initial ? 'Editar publicação' : 'Nova publicação'} onClose={onClose}><form className="admin-form" onSubmit={submit}>
    <div className="admin-form-grid"><label>Título<input required maxLength={200} name="title" defaultValue={initial?.title} data-testid="input-publication-title" /></label><label>Identificador URL<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" name="slug" defaultValue={initial?.slug} data-testid="input-publication-slug" /></label>
      <label>Categoria<input required maxLength={80} name="category" defaultValue={initial?.category} data-testid="input-publication-category" /></label><label>Autor<input maxLength={120} name="author" defaultValue={initial?.author ?? ''} data-testid="input-publication-author" /></label>
      <label>Imagem · URL<input type="url" name="imageUrl" defaultValue={initial?.imageUrl ?? ''} data-testid="input-publication-image" /></label><label>Data de publicação<input type="datetime-local" name="publishedAt" defaultValue={dateValue} data-testid="input-publication-date" /></label>
      <label>Estado<select name="status" defaultValue={initial?.status ?? 'draft'} data-testid="select-publication-status"><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label>
      <label className="admin-span-two">Conteúdo<textarea required maxLength={50000} rows={9} name="content" defaultValue={initial?.content} data-testid="textarea-publication-content" /></label>
      <label>SEO · título<input maxLength={160} name="seoTitle" defaultValue={initial?.seoTitle ?? ''} data-testid="input-publication-seo-title" /></label><label>SEO · descrição<input maxLength={320} name="seoDescription" defaultValue={initial?.seoDescription ?? ''} data-testid="input-publication-seo-description" /></label>
    </div><div className="admin-form-actions"><button type="button" className="admin-button secondary" onClick={onClose} data-testid="button-publication-cancel">Cancelar</button><button type="submit" className="admin-button primary" disabled={isPending} data-testid="button-publication-save">{isPending ? 'A guardar…' : 'Guardar publicação'}</button></div>
    {(create.isError || update.isError) && <p className="admin-inline-error" role="alert">Não foi possível guardar a publicação. Verifique os campos e tente novamente.</p>}
  </form></EditDialog>;
}

function PublicationsAdmin() {
  const client = useQueryClient();
  const query = useListAdminPublications();
  const archive = useArchiveAdminPublication();
  const [editing, setEditing] = useState<Publication | null | undefined>(undefined);
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('all');
  const items = (query.data ?? []).filter((item) => filter === 'all' || item.status === filter);
  function archiveArticle(item: Publication) {
    if (!window.confirm(`Arquivar “${item.title}”?`)) return;
    archive.mutate({ id: item.id }, { onSuccess: () => {
      client.invalidateQueries({ queryKey: getListAdminPublicationsQueryKey() });
      client.invalidateQueries({ queryKey: getListPublicationsQueryKey() });
      client.invalidateQueries({ queryKey: getGetPublicationsBySlugQueryKey(item.slug) });
      client.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() });
      setNotice('Publicação arquivada com sucesso.');
    } });
  }
  return <><div className="admin-toolbar"><p>Escreva, reveja e publique conteúdos institucionais.</p><div className="admin-toolbar-actions"><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrar publicações por estado" data-testid="filter-publication-status"><option value="all">Todos os estados</option><option value="draft">Rascunhos</option><option value="published">Publicados</option><option value="archived">Arquivados</option></select><button className="admin-button primary" type="button" onClick={() => setEditing(null)} data-testid="button-create-publication"><Plus size={15} /> Nova publicação</button></div></div>
    {notice && <div className="admin-notice success" role="status" data-testid="status-publication-success"><Check size={16} />{notice}<button type="button" onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={14} /></button></div>}
    {query.isLoading ? <LoadingPanel label="publicações" /> : query.isError ? <ErrorPanel text="Não foi possível carregar as publicações." retry={() => query.refetch()} /> : items.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Publicação</th><th>Categoria</th><th>Estado</th><th>Actualizado</th><th><span className="sr-only">Acções</span></th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><small>/{item.slug}</small></td><td>{item.category}</td><td><span className={`admin-status ${item.status}`}>{item.status}</span></td><td>{new Date(item.updatedAt).toLocaleDateString('pt-PT')}</td><td className="admin-row-actions"><button type="button" onClick={() => setEditing(item)} data-testid={`button-edit-publication-${item.id}`}>Editar</button>{item.status !== 'archived' && <button type="button" onClick={() => archiveArticle(item)} disabled={archive.isPending} data-testid={`button-archive-publication-${item.id}`}>Arquivar</button>}</td></tr>)}</tbody></table></div> : <div className="admin-empty"><FileText size={22} /><strong>Nenhuma publicação encontrada</strong><span>Crie um rascunho ou altere o filtro de estado.</span></div>}
    {archive.isError && <p className="admin-inline-error" role="alert">A publicação não foi arquivada. Tente novamente.</p>}
    {editing !== undefined && <PublicationEditor initial={editing || undefined} onClose={() => setEditing(undefined)} onSaved={setNotice} />}
  </>;
}

function InquiriesAdmin() {
  const client = useQueryClient();
  const [filter, setFilter] = useState('all');
  const query = useListAdminInquiries(filter === 'all' ? undefined : { status: filter as 'new' | 'reviewed' | 'archived' });
  const update = useUpdateAdminInquiry();
  const [notice, setNotice] = useState('');
  const items = query.data ?? [];
  function setStatus(inquiry: ContactInquiry, status: 'reviewed' | 'archived' | 'new') {
    update.mutate({ id: inquiry.id, data: { status } }, { onSuccess: () => {
      client.invalidateQueries({ queryKey: getListAdminInquiriesQueryKey() });
      client.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() });
      setNotice('Estado do pedido atualizado.');
    } });
  }
  return <><div className="admin-toolbar"><p>Analise as mensagens recebidas e atualize o seu estado de acompanhamento.</p><div className="admin-toolbar-actions"><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrar pedidos por estado" data-testid="filter-inquiry-status"><option value="all">Todos os pedidos</option><option value="new">Novos</option><option value="reviewed">Revistos</option><option value="archived">Arquivados</option></select></div></div>
    {notice && <div className="admin-notice success" role="status" data-testid="status-inquiry-success"><Check size={16} />{notice}<button type="button" onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={14} /></button></div>}
    {query.isLoading ? <LoadingPanel label="pedidos de contacto" /> : query.isError ? <ErrorPanel text="Não foi possível carregar os pedidos de contacto." retry={() => query.refetch()} /> : items.length ? <div className="inquiry-list">{items.map((item) => <article className="inquiry-card" key={item.id} data-testid={`inquiry-${item.id}`}><header><div><span className={`admin-status ${item.status}`}>{item.status}</span><h2>{item.name}</h2><a href={`mailto:${item.email}`} data-testid={`link-inquiry-email-${item.id}`}>{item.email}</a></div><time>{new Date(item.createdAt).toLocaleString('pt-PT')}</time></header><div className="inquiry-meta">{item.category}</div><p>{item.message}</p><div className="inquiry-actions">{item.status !== 'reviewed' && <button type="button" onClick={() => setStatus(item, 'reviewed')} disabled={update.isPending} data-testid={`button-review-inquiry-${item.id}`}><Check size={14} /> Marcar como revisto</button>}{item.status !== 'archived' && <button type="button" onClick={() => setStatus(item, 'archived')} disabled={update.isPending} data-testid={`button-archive-inquiry-${item.id}`}>Arquivar</button>}{item.status === 'archived' && <button type="button" onClick={() => setStatus(item, 'new')} disabled={update.isPending} data-testid={`button-restore-inquiry-${item.id}`}>Reabrir pedido</button>}</div></article>)}</div> : <div className="admin-empty"><Inbox size={22} /><strong>Nenhum pedido de contacto</strong><span>As mensagens recebidas serão apresentadas nesta lista.</span></div>}
    {update.isError && <p className="admin-inline-error" role="alert">Não foi possível atualizar o pedido. Tente novamente.</p>}
  </>;
}

export function AdminArea() {
  const [location] = useLocation();
  const session = useGetAdminSession();
  if (session.isLoading) return <div className="admin-auth-wait"><div className="admin-auth-skeleton" /><span>A verificar a sessão de administração…</span></div>;
  if (session.isError || !session.data) return <section className="admin-auth-denied"><span className="admin-kicker">Área privada / verificação necessária</span><h1>Acesso restrito.</h1><p>A sessão não foi autorizada pelo serviço de administração. Inicie sessão com uma conta autorizada ou regresse ao portal público.</p><div><Link href="/sign-in" className="button-primary" data-testid="link-admin-signin">Iniciar sessão</Link><Link href="/" className="text-link" data-testid="link-admin-public-home">Voltar ao portal</Link></div></section>;
  let title = 'Visão geral';
  let kicker = 'Painel / resumo';
  let page = <Overview />;
  if (location === '/admin/empresas') { title = 'Empresas'; kicker = 'Conteúdo / perfis empresariais'; page = <CompaniesAdmin />; }
  if (location === '/admin/publicacoes') { title = 'Publicações'; kicker = 'Conteúdo / arquivo editorial'; page = <PublicationsAdmin />; }
  if (location === '/admin/contactos') { title = 'Contactos'; kicker = 'Relação pública / pedidos recebidos'; page = <InquiriesAdmin />; }
  return <AdminFrame title={title} kicker={kicker}><div className="admin-session-banner"><span>Identificado como <strong>{session.data.email}</strong></span><span>{session.data.role.replace('_', ' ')}</span></div>{page}</AdminFrame>;
}
