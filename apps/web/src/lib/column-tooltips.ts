/** Única fonte de verdade para textos de tooltip das colunas da tabela de produtos. */
export const COLUMN_TOOLTIPS: Record<string, string> = {
  productName:
    'Nome completo do produto conforme cadastrado na planilha.',
  ean: 'Código de identificação do produto usado pelos fabricantes.',
  storesWithStock:
    'Quantidade de lojas da rede que possuem este produto em estoque.',
  distribution:
    'Percentual de lojas que possuem o produto em relação ao total de lojas da empresa.',
  branchesWithDemand:
    'Quantidade de lojas que registraram vendas deste produto nos últimos 3 meses.',
  demandVsDistribution:
    'Razão entre as lojas com demanda e as lojas com estoque, em percentual.',
  idd:
    'Índice de Distribuição e Demanda. Mede o equilíbrio entre onde o produto está e onde ele é vendido. Negativo indica excesso de estoque sem demanda correspondente.',
  stock: 'Quantidade total do produto somada entre todas as filiais.',
  averageDemand:
    'Média mensal de unidades vendidas calculada com base no histórico de vendas.',
  stockDays:
    'Projeção de quantos dias o estoque atual durará considerando a demanda média.',
  unitPrice: 'Valor unitário do produto em reais.',
  projectedRevenue:
    'Estimativa do faturamento gerado nos próximos 30 dias com o estoque atual.',
  tiedUpCapital:
    'Valor financeiro do estoque que sobra após 30 dias sem ser vendido.',
  lostRevenue:
    'Valor que a empresa deixa de faturar por falta de estoque para suprir a demanda dos 30 dias.',
  itemStatus:
    'Classificação operacional com base em dias de estoque e IDD. Passe o mouse no badge para ver o detalhamento.',
};
