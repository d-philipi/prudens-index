export const strings = {
  common: {
    status: 'Status',
    loading: 'Carregando...',
    notAvailable: '—',
  },
  admin: {
    companies: 'Empresas',
    imports: 'Importações',
    uploadSpreadsheet: 'Importar planilha de estoque',
    noCompanies: 'Nenhuma empresa cadastrada.',
    loadingCompanies: 'Carregando empresas...',
    importHistory: 'Histórico de importações',
    openCompanyImports: 'Abrir importações desta empresa',
    backToCompanies: 'Voltar para empresas',
    activeDashboardSource: 'Fonte ativa do dashboard do cliente',
    activeJob: 'Job ativo',
    noActiveImport: 'Nenhuma importação ativa.',
  },
  client: {
    noChartData: 'Nenhum produto para exibir no gráfico.',
    productsPageInfo: 'de',
    productsLabel: 'produtos',
    currentPage: 'página atual',
    updatingProducts: 'Atualizando produtos...',
    noStockData:
      'Nenhum dado de estoque disponível ainda. Aguarde o administrador concluir uma importação para sua empresa.',
  },
  errors: {
    uploadFailed: 'Falha no upload',
    invalidSpreadsheet:
      'Selecione uma planilha (.xlsx, .xls, .xlsm, .xlsb, .csv, .tsv ou .ods)',
    loadCompanies: 'Erro ao carregar empresas',
    validationErrorsTitle: 'Erros de validação da planilha',
    noValidationErrors: 'Nenhum erro de validação para este job.',
    spreadsheetOnly: 'Apenas arquivos de planilha são permitidos',
  },
  statusLabels: {
    queued: 'Na fila',
    processing: 'Processando',
    completed: 'Concluído',
    failed: 'Falhou',
  },
  itemStatus: {
    distribution: 'Redistribuição',
    adequate: 'Adequado',
    boost: 'Impulsionar',
  },
} as const;
