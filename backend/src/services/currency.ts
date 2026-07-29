import { getMany, getOne } from "../config/database";

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  isDefault: boolean;
}

interface ConvertedAmount {
  amount: number;
  currency: string;
  symbol: string;
  formatted: string;
  exchangeRate: number;
}

export const getCurrencies = async (): Promise<CurrencyInfo[]> => {
  const currencies = await getMany(`SELECT * FROM currency_rates ORDER BY "isDefault" DESC, code ASC`, []);
  return currencies.map((c: any) => ({
    code: c.code,
    name: c.name,
    symbol: c.symbol,
    rate: parseFloat(c.rate),
    isDefault: c.isDefault,
  }));
};

export const getDefaultCurrency = async (): Promise<CurrencyInfo> => {
  const currency = await getOne(`SELECT * FROM currency_rates WHERE "isDefault" = true LIMIT 1`, []);
  if (!currency) return { code: "USD", name: "US Dollar", symbol: "$", rate: 1, isDefault: true };
  return {
    code: currency.code,
    name: currency.name,
    symbol: currency.symbol,
    rate: parseFloat(currency.rate),
    isDefault: currency.isDefault,
  };
};

export const convertAmount = async (
  amountInDefault: number,
  targetCurrency: string
): Promise<ConvertedAmount> => {
  const defaultCur = await getDefaultCurrency();
  const target = await getOne(`SELECT * FROM currency_rates WHERE code = $1`, [targetCurrency]);
  if (!target) {
    return {
      amount: amountInDefault,
      currency: defaultCur.code,
      symbol: defaultCur.symbol,
      formatted: `${defaultCur.symbol}${amountInDefault.toFixed(2)}`,
      exchangeRate: 1,
    };
  }

  const targetRate = parseFloat(target.rate);
  const defaultRate = defaultCur.rate;
  const converted = (amountInDefault / defaultRate) * targetRate;

  return {
    amount: Math.round(converted * 100) / 100,
    currency: target.code,
    symbol: target.symbol,
    formatted: `${target.symbol}${converted.toFixed(2)}`,
    exchangeRate: targetRate / defaultRate,
  };
};

export const formatAmount = (amount: number, currencyCode?: string, currencySymbol?: string): string => {
  const symbol = currencySymbol || "$";
  return `${symbol}${amount.toFixed(2)}`;
};
