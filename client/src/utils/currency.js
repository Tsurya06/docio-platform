/**
 * Render a monetary amount in Indian Rupee, the platform's currency.
 *
 * The backend stores a plain number (`consultationFee`, `revenue.total`); the client is the
 * only place that decides how to display it, so currency formatting lives here once. Using a
 * helper (rather than sprinkling `₹${value}` across pages) keeps the symbol + grouping rules
 * consistent and gives the whole app a single place to change if the locale ever shifts.
 *
 * `Intl.NumberFormat('en-IN', ...)` gives Indian digit-grouping (1,00,000) — which `Number(x).toString()`
 * would not. `minimumFractionDigits: 0` keeps whole-rupee fees clean (₹500, not ₹500.00).
 *
 * `null` / `undefined` / `''` → '—' so callers don't each re-implement the empty check.
 */
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatINR(value) {
  if (value == null || value === '' || Number.isNaN(Number(value))) return '—';
  return inr.format(Number(value));
}

export const INR_PREFIX = '₹';

export default formatINR;
