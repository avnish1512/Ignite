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
  
  // If amount is very small (e.g. < 100), assume it might already be in LPA format
  // or it's a raw small number. We show it with 1 decimal place.
  if (amount < 100) return amount.toFixed(1);

  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return `${amount}`;
}

function normalizeCTC(ctc: any): any {
  if (typeof ctc === 'string') {
    try {
      const trimmed = ctc.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        return JSON.parse(trimmed);
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }
  return ctc;
}

/**
 * Returns a formatted CTC string for display on cards and detail pages.
 * Handles all possible shapes of the CTC field.
 */
export function formatSalary(ctcRaw: any): string {
  if (!ctcRaw) return 'Competitive';
  
  const ctc = normalizeCTC(ctcRaw);

  if (typeof ctc === 'number') {
    return `INR ${formatAmount(ctc)}${ctc < 100 ? ' LPA' : ''}`;
  }
  
  // If it's a string, return it but remove "none" placeholders
  if (typeof ctc === 'string') {
    const trimmed = ctc.trim().toLowerCase();
    if (trimmed === 'none' || trimmed === 'n/a') return 'Competitive';
    return ctc;
  }

  if (typeof ctc === 'object' && ctc !== null) {
    const min = Number(ctc.min);
    const max = Number(ctc.max);

    // Both are invalid or zero
    if ((isNaN(min) || min <= 0) && (isNaN(max) || max <= 0)) {
      return 'Competitive';
    }

    // Only one valid
    if (isNaN(min) || min <= 0) return `INR ${formatAmount(max)}${max < 100 ? ' LPA' : ''}`;
    if (isNaN(max) || max <= 0) return `INR ${formatAmount(min)}${min < 100 ? ' LPA' : ''}`;

    // Both valid
    if (min === max) {
      return `INR ${formatAmount(min)}${min < 100 ? ' LPA' : ''}`;
    }
    
    const suffix = (min < 100 || max < 100) ? ' LPA' : '';
    return `INR ${formatAmount(min)} - ${formatAmount(max)}${suffix}`;
  }

  return 'Competitive';
}

/**
 * Formats CTC for inline short display (e.g. home screen job list).
 */
export function formatSalaryLPA(ctcRaw: any): string {
  if (!ctcRaw) return 'Competitive';
  
  const ctc = normalizeCTC(ctcRaw);

  if (typeof ctc === 'number') {
    if (ctc < 100) return `₹${ctc.toFixed(1)} LPA`;
    const lpa = ctc / 100000;
    if (lpa < 0.1) return `₹${formatAmount(ctc)}`;
    return `₹${lpa.toFixed(1)} LPA`;
  }

  if (typeof ctc === 'string') {
    const trimmed = ctc.trim().toLowerCase();
    if (trimmed === 'none' || trimmed === 'n/a') return 'Competitive';
    return ctc;
  }

  if (typeof ctc === 'object' && ctc !== null) {
    const min = Number(ctc.min);
    const max = Number(ctc.max);

    if ((isNaN(min) || min <= 0) && (isNaN(max) || max <= 0)) {
      return 'Competitive';
    }

    // Handle small numbers gracefully without returning "0.0 LPA"
    const formatLPAValue = (val: number) => {
      if (val < 100) return `${val.toFixed(1)} LPA`;
      const lpa = val / 100000;
      if (lpa < 0.1) return formatAmount(val);
      return `${lpa.toFixed(1)} LPA`;
    };

    const minLPA = !isNaN(min) && min > 0 ? formatLPAValue(min) : null;
    const maxLPA = !isNaN(max) && max > 0 ? formatLPAValue(max) : null;

    if (minLPA && maxLPA) {
      return minLPA === maxLPA ? `₹${minLPA}` : `₹${minLPA} - ${maxLPA}`;
    }
    if (minLPA) return `₹${minLPA}`;
    if (maxLPA) return `₹${maxLPA}`;
  }

  return 'Competitive';
}
