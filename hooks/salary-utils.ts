/**
 * Salary formatting utilities — centralized, defensive CTC formatting.
 * Handles all edge cases: null, undefined, NaN, string, object { min, max }.
 */

/**
 * Formats a CTC amount (in INR) into a human-readable string.
 * e.g. 1200000 → "12.0L", 15000000 → "1.5Cr", 50000 → "50K"
 */
function formatAmount(amount: number): string {
  if (!amount || isNaN(amount) || amount <= 0) return '0';
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
}

/**
 * Returns a formatted CTC string for display on cards and detail pages.
 * Handles all possible shapes of the CTC field from Firestore.
 *
 * @example
 *   formatSalary(null)                    → "Competitive"
 *   formatSalary({ min: 500000, max: 1200000 }) → "INR 5.0L - 12.0L"
 *   formatSalary({ min: 800000, max: 800000 })  → "INR 8.0L"
 *   formatSalary("10 LPA")               → "10 LPA"
 */
export function formatSalary(ctc: any): string {
  if (!ctc) return 'Competitive';
  if (typeof ctc === 'string') return ctc;

  if (typeof ctc === 'object' && ctc !== null) {
    const min = Number(ctc.min);
    const max = Number(ctc.max);

    // Both are invalid or zero
    if ((isNaN(min) || min <= 0) && (isNaN(max) || max <= 0)) {
      return 'Competitive';
    }

    // Only one valid
    if (isNaN(min) || min <= 0) return `INR ${formatAmount(max)}`;
    if (isNaN(max) || max <= 0) return `INR ${formatAmount(min)}`;

    // Both valid
    return min === max
      ? `INR ${formatAmount(min)}`
      : `INR ${formatAmount(min)} - ${formatAmount(max)}`;
  }

  return 'Competitive';
}

/**
 * Formats CTC for inline short display (e.g. home screen job list).
 * Returns "₹X.X - Y.Y LPA" format or fallback.
 *
 * @example
 *   formatSalaryLPA(null)                         → "Competitive"
 *   formatSalaryLPA({ min: 500000, max: 1200000}) → "₹5.0 - 12.0 LPA"
 */
export function formatSalaryLPA(ctc: any): string {
  if (!ctc) return 'Competitive';
  if (typeof ctc === 'string') return ctc;

  if (typeof ctc === 'object' && ctc !== null) {
    const min = Number(ctc.min);
    const max = Number(ctc.max);

    if ((isNaN(min) || min <= 0) && (isNaN(max) || max <= 0)) {
      return 'Competitive';
    }

    const minLPA = !isNaN(min) && min > 0 ? (min / 100000).toFixed(1) : null;
    const maxLPA = !isNaN(max) && max > 0 ? (max / 100000).toFixed(1) : null;

    if (minLPA && maxLPA) {
      return minLPA === maxLPA ? `₹${minLPA} LPA` : `₹${minLPA} - ${maxLPA} LPA`;
    }
    if (minLPA) return `₹${minLPA} LPA`;
    if (maxLPA) return `₹${maxLPA} LPA`;
  }

  return 'Competitive';
}
