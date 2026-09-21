const eur = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const money = (value: number) => eur.format(Number.isFinite(value) ? value : 0);

export const moneySigned = (value: number) => (value > 0 ? `+${money(value)}` : money(value));

/**
 * Aceita "12,50" e "12.50". Devolve null quando o valor não é válido.
 */
export function parseAmount(raw: FormDataEntryValue | null): number | null {
  if (raw === null) return null;
  const text = String(raw).trim().replace(/\s/g, "").replace(",", ".");
  if (!text) return null;
  const n = Number(text);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

export const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export const pluralize = (n: number, one: string, many: string) => (n === 1 ? one : many);
