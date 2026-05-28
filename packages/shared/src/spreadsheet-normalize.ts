/**
 * Normaliza cabeçalhos de planilha para comparação tolerante:
 * minúsculas, sem acentos, hífens/underscores viram espaço.
 */
export function normalizeSpreadsheetHeaderKey(header: string): string {
  return header
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[-–—_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converte célula numérica ou monetária (ex.: "R$ 56,00", "1.234,56") em número.
 */
export function parseSpreadsheetNumber(
  v: string | number | null | undefined,
): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;

  let s = String(v).trim();
  if (!s) return null;

  s = s.replace(/\s/g, '');
  s = s.replace(/^(r\$|rs\$|\$|brl)/i, '');
  s = s.replace(/[a-zA-Z%]/g, '');

  if (!s || /^[-+.]$/.test(s)) return null;

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (lastComma >= 0) {
    const decimals = s.length - lastComma - 1;
    s = decimals <= 2 ? s.replace(',', '.') : s.replace(/,/g, '');
  } else if (lastDot >= 0) {
    const parts = s.split('.');
    if (parts.length > 2) {
      const last = parts[parts.length - 1]!;
      if (last.length <= 2) {
        s = `${parts.slice(0, -1).join('')}.${last}`;
      } else {
        s = parts.join('');
      }
    }
  }

  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export function parseSpreadsheetInt(
  v: string | number | null | undefined,
): number | null {
  const n = parseSpreadsheetNumber(v);
  if (n == null) return null;
  return Math.trunc(n);
}

/** Busca valor da linha pelo cabeçalho canônico, tolerando variações de escrita. */
export function getSpreadsheetCell(
  row: Record<string, string | number | null | undefined>,
  canonicalHeader: string,
): string | number | null | undefined {
  if (canonicalHeader in row) return row[canonicalHeader];
  const target = normalizeSpreadsheetHeaderKey(canonicalHeader);
  for (const [key, value] of Object.entries(row)) {
    if (normalizeSpreadsheetHeaderKey(key) === target) return value;
  }
  return undefined;
}
