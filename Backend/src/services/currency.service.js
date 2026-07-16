

const FALLBACK_RATES = {
  USD: { USD: 1, INR: 83.5, EUR: 0.92, GBP: 0.78, CAD: 1.37, AUD: 1.5 },
  INR: { INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0094, CAD: 0.016, AUD: 0.018 },
  EUR: { EUR: 1, USD: 1.09, INR: 91.0, GBP: 0.85, CAD: 1.49, AUD: 1.63 }
};

export const getExchangeRate = async (baseCurrency, targetCurrency) => {
  if (baseCurrency === targetCurrency) return 1;
  
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && data.rates[targetCurrency]) {
        return data.rates[targetCurrency];
      }
    }
  } catch (error) {
    console.warn(`Exchange rate API failed for ${baseCurrency} to ${targetCurrency}, using fallback rates:`, error);
  }

  // Fallback lookup
  const baseRates = FALLBACK_RATES[baseCurrency] || FALLBACK_RATES.INR;
  if (baseRates[targetCurrency]) {
    return baseRates[targetCurrency];
  }
  
  // Standard conversion fallback estimates relative to USD
  const usdToTarget = FALLBACK_RATES.USD[targetCurrency] || 1;
  const usdToBase = FALLBACK_RATES.USD[baseCurrency] || 1;
  return usdToTarget / usdToBase;
};
