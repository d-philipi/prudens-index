/** Remove máscara e retorna só dígitos, ou null se vazio. */
export function normalizeCnpj(value: string | null | undefined): string | null {
  if (value == null) return null;
  const digits = value.replace(/\D/g, '');
  return digits.length === 0 ? null : digits;
}

function allSameDigit(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

/** Valida 14 dígitos com dígitos verificadores (CNPJ). */
export function isValidCnpjDigits(digits: string): boolean {
  if (!/^\d{14}$/.test(digits) || allSameDigit(digits)) return false;

  const calcCheck = (base: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += Number(base[i]) * weights[i]!;
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calcCheck(digits, w1);
  const d2 = calcCheck(digits, w2);
  return d1 === Number(digits[12]) && d2 === Number(digits[13]);
}
