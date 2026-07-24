function computeUpBox({ price, sma50, sma200 }) {
  if (price == null || sma50 == null || sma200 == null) return 'warn';
  if (price > sma50 && sma50 > sma200) return 'ok';
  if (price < sma200) return 'fail';
  return 'warn';
}

function computeStatus({ price, trigger, warn }) {
  if (price == null || trigger == null) return 'check';
  if (price < trigger) return 'broken';
  if (warn != null && price < warn) return 'weak';
  return 'hold';
}

function computeVerdict({ ind, best, up }) {
  if (best === 'fail' || up === 'fail') return 'fail';
  if (ind === 'ok' && best === 'ok' && up === 'ok') return 'pass';
  return 'partial';
}

module.exports = { computeUpBox, computeStatus, computeVerdict };
