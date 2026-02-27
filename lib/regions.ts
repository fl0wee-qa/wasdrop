export type CountryOption = {
  code: string;
  label: string;
  currency: string;
  locale: string;
};

export const COUNTRIES: CountryOption[] = [
  { code: "US", label: "United States", currency: "USD", locale: "en-US" },
  { code: "GB", label: "United Kingdom", currency: "GBP", locale: "en-GB" },
  { code: "DE", label: "Germany", currency: "EUR", locale: "de-DE" },
  { code: "FR", label: "France", currency: "EUR", locale: "fr-FR" },
  { code: "CA", label: "Canada", currency: "CAD", locale: "en-CA" },
  { code: "JP", label: "Japan", currency: "JPY", locale: "ja-JP" },
  { code: "AU", label: "Australia", currency: "AUD", locale: "en-AU" },
  { code: "BR", label: "Brazil", currency: "BRL", locale: "pt-BR" },
  { code: "PL", label: "Poland", currency: "PLN", locale: "pl-PL" },
  { code: "SE", label: "Sweden", currency: "SEK", locale: "sv-SE" },
];

export const DEFAULT_COUNTRY = "US";

export function getCountryOption(code?: string | null) {
  if (!code) {
    return COUNTRIES.find((country) => country.code === DEFAULT_COUNTRY)!;
  }

  return COUNTRIES.find((country) => country.code === code.toUpperCase()) ??
    COUNTRIES.find((country) => country.code === DEFAULT_COUNTRY)!;
}

export function formatMoney(amountCents: number, countryCode?: string | null, currencyOverride?: string | null) {
  const country = getCountryOption(countryCode);
  const currency = currencyOverride ?? country.currency;

  return new Intl.NumberFormat(country.locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}
