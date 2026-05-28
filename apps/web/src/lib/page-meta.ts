export interface PageMeta {
  title: string;
  subtitle?: string;
}

type PagePattern = {
  test: (pathname: string) => boolean;
  meta: PageMeta;
};

const PATTERNS: PagePattern[] = [
  {
    test: (p) => p === '/dashboard',
    meta: { title: 'Dashboard', subtitle: 'Análise de estoque e IDD dos produtos' },
  },
  {
    test: (p) => p === '/admin',
    meta: { title: 'Empresas', subtitle: 'Visão geral e métricas do portfólio' },
  },
  {
    test: (p) => p === '/admin/usuarios',
    meta: { title: 'Usuários', subtitle: 'Convites e perfis de acesso' },
  },
  {
    test: (p) => p === '/admin/imports',
    meta: { title: 'Importações', subtitle: 'Histórico global de jobs' },
  },
  {
    test: (p) => p === '/admin/companies/new',
    meta: { title: 'Nova empresa', subtitle: 'Cadastro de cliente' },
  },
  {
    test: (p) => /^\/admin\/companies\/[^/]+\/imports$/.test(p),
    meta: { title: 'Importações da empresa', subtitle: 'Planilhas e status dos jobs' },
  },
  {
    test: (p) => /^\/admin\/companies\/[^/]+$/.test(p),
    meta: { title: 'Detalhe da empresa', subtitle: 'Dados cadastrais e histórico' },
  },
];

const DEFAULT_META: PageMeta = { title: 'Prudens Index' };

export function resolvePageMeta(pathname: string): PageMeta {
  const match = PATTERNS.find((p) => p.test(pathname));
  return match?.meta ?? DEFAULT_META;
}
