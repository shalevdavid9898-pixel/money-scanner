// yahoo-finance2 ships ESM-only; this project is CommonJS, so it's loaded via
// dynamic import and cached rather than a top-level require(). The default
// export is a class (not a ready instance) — construct it once.
let yahooFinancePromise;
function loadYahooFinance() {
  if (!yahooFinancePromise) {
    yahooFinancePromise = import('yahoo-finance2').then(
      (mod) => new mod.default({ suppressNotices: ['yahooSurvey'] })
    );
  }
  return yahooFinancePromise;
}

const SECTOR_ETF = {
  Technology: 'XLK',
  'Financial Services': 'XLF',
  Financials: 'XLF',
  Energy: 'XLE',
  Healthcare: 'XLV',
  'Consumer Cyclical': 'XLY',
  'Consumer Discretionary': 'XLY',
  'Consumer Defensive': 'XLP',
  'Consumer Staples': 'XLP',
  Industrials: 'XLI',
  'Basic Materials': 'XLB',
  Materials: 'XLB',
  Utilities: 'XLU',
  'Real Estate': 'XLRE',
  'Communication Services': 'XLC',
};

function yahooSymbol(ticker, market) {
  if (market === 'TASE') return `${ticker}.TA`;
  if (market === 'CRYPTO') return `${ticker}-USD`;
  return ticker;
}

async function getQuote(ticker, market) {
  const yahooFinance = await loadYahooFinance();
  const symbol = yahooSymbol(ticker, market);
  const q = await yahooFinance.quote(symbol);
  return {
    price: q.regularMarketPrice ?? null,
    changePercent: q.regularMarketChangePercent ?? null,
  };
}

async function getMovingAverages(ticker, market) {
  const yahooFinance = await loadYahooFinance();
  const symbol = yahooSymbol(ticker, market);
  const period2 = new Date();
  const period1 = new Date(period2.getTime() - 300 * 24 * 60 * 60 * 1000);
  const result = await yahooFinance.chart(symbol, { period1, period2, interval: '1d' });
  const closes = (result.quotes || []).map((q) => q.close).filter((c) => typeof c === 'number');
  if (closes.length < 50) return { sma50: null, sma200: null };
  const sma = (n) => {
    if (closes.length < n) return null;
    const slice = closes.slice(-n);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  };
  return { sma50: sma(50), sma200: sma(200) };
}

async function getFundamentals(ticker, market) {
  const yahooFinance = await loadYahooFinance();
  const symbol = yahooSymbol(ticker, market);
  const qs = await yahooFinance.quoteSummary(symbol, {
    modules: ['financialData', 'summaryProfile', 'calendarEvents'],
  });
  const fd = qs.financialData || {};
  const profile = qs.summaryProfile || {};
  let earningsDate = '';
  const earnings = qs.calendarEvents?.earnings?.earningsDate;
  if (Array.isArray(earnings) && earnings[0]) {
    earningsDate = new Date(earnings[0]).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
  }
  return {
    revenueGrowth: fd.revenueGrowth ?? null,
    grossMargin: fd.grossMargins ?? null,
    operatingMargin: fd.operatingMargins ?? null,
    roe: fd.returnOnEquity ?? null,
    sector: profile.sector || null,
    industry: profile.industry || null,
    earningsDate,
  };
}

async function getSectorMomentum(sector) {
  const etf = SECTOR_ETF[sector];
  if (!etf) return null;
  const [quote, ma] = await Promise.all([getQuote(etf, 'US'), getMovingAverages(etf, 'US')]);
  return { etf, ...quote, ...ma };
}

module.exports = { yahooSymbol, getQuote, getMovingAverages, getFundamentals, getSectorMomentum };
