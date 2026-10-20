const APPAREL_SCALE = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

function normalizeApparelToken(token: string): string {
  const t = token.trim().toUpperCase();
  if (t === '2XL') return 'XXL';
  return t;
}

/**
 * Expands a size range string from Column M (TALLE) such as:
 * - "S/XL" -> ["S", "M", "L", "XL"]
 * - "XS/L" -> ["XS", "S", "M", "L"]
 * - "S/XXL" -> ["S", "M", "L", "XL", "XXL"]
 * - "19-26" -> ["19", "20", ..., "26"]
 * - "27-34" -> ["27", "28", ..., "34"]
 * - "35-41" -> ["35", "36", ..., "41"]
 * - "35-45" or "35/45" -> ["35", "36", ..., "45"]
 * - "39-45" -> ["39", "40", ..., "45"]
 * - "M (37-40) -L (41-44)" -> ["M (37-40)", "L (41-44)"]
 * - "M / L" -> ["M", "L"]
 * - "S | M | L | Xl" -> ["S", "M", "L", "XL"]
 * - "Único" -> ["Único"]
 */
export function expandSizeRange(
  sizeRange?: string,
  fallbackSizes?: string[],
  division?: string
): string[] {
  const normDiv = (division || '').toUpperCase().trim();
  const isApparel = normDiv === 'INDUMENTARIA';
  const isAccessory = normDiv === 'ACCESORIOS';
  const rawRange = (sizeRange || '').trim();
  const candidate =
    rawRange ||
    (Array.isArray(fallbackSizes) && fallbackSizes.length === 1 ? fallbackSizes[0].trim() : '');

  if (candidate) {
    // 0. Check pipe-separated list like "S | M | L | Xl"
    if (candidate.includes('|')) {
      const list = candidate.split('|').map(s => normalizeApparelToken(s)).filter(Boolean);
      if (list.length > 0) return list;
    }

    // Check accessory dual-range like "M (37-40) -L (41-44)"
    if (candidate.includes('-L') || candidate.includes('- L')) {
      const list = candidate.split(/\s*-\s*(?=L)/i).map(s => s.trim()).filter(Boolean);
      if (list.length > 1) return list;
    }

    // 1. Check apparel range like "S/XL", "XS/XL", "S-XL", "S/XXL" or "M / L"
    const parts = candidate.split(/[\/\-]/).map(s => normalizeApparelToken(s));
    if (parts.length === 2) {
      if (isAccessory && candidate.includes('/')) {
        return parts.filter(Boolean);
      }
      const startIdx = APPAREL_SCALE.indexOf(parts[0]);
      const endIdx = APPAREL_SCALE.indexOf(parts[1]);
      if (startIdx !== -1 && endIdx !== -1 && endIdx >= startIdx) {
        if (isAccessory && endIdx - startIdx === 1) {
          return [parts[0], parts[1]];
        }
        return APPAREL_SCALE.slice(startIdx, endIdx + 1);
      }

      // 2. Check numeric footwear range like "19-26", "27-34", "35-41", "35-45", "39-45" (ONLY if not INDUMENTARIA)
      if (!isApparel) {
        const numStart = Number(parts[0]);
        const numEnd = Number(parts[1]);
        if (!isNaN(numStart) && !isNaN(numEnd) && numEnd >= numStart && numEnd - numStart <= 30) {
          if (Number.isInteger(numStart) && Number.isInteger(numEnd) && numStart >= 15) {
            return Array.from({ length: numEnd - numStart + 1 }, (_, i) => String(numStart + i));
          }
          const out: string[] = [];
          for (let s = numStart; s <= numEnd; s += 0.5) {
            out.push(String(s));
          }
          return out;
        }
      }
    }

    // 3. Single apparel token or comma-separated list
    if (candidate.includes(',')) {
      const list = candidate.split(',').map(s => s.trim()).filter(Boolean);
      if (list.length > 0 && (!isApparel || list.every(t => APPAREL_SCALE.includes(normalizeApparelToken(t))))) {
        return list;
      }
    }
    if (APPAREL_SCALE.includes(normalizeApparelToken(candidate))) {
      return [normalizeApparelToken(candidate)];
    }

    if (isAccessory || candidate.toLowerCase().includes('único') || candidate.toLowerCase().includes('unico')) {
      return [candidate];
    }
  }

  // Check if fallbackSizes is already an expanded array
  if (Array.isArray(fallbackSizes) && fallbackSizes.length > 0) {
    if (!isApparel) {
      return fallbackSizes.map(s => String(s).trim());
    }
    const first = fallbackSizes[0];
    if (APPAREL_SCALE.includes(normalizeApparelToken(first))) {
      return fallbackSizes.map(s => normalizeApparelToken(s));
    }
  }

  if (isApparel) {
    return ['S', 'M', 'L', 'XL'];
  }
  if (isAccessory) {
    return ['Único'];
  }

  return ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
}

export function getProductSizes(item: {
  sizeRange?: string;
  sizes?: string[];
  division?: string;
}): string[] {
  return expandSizeRange(item?.sizeRange, item?.sizes, item?.division);
}

export interface ProductCurveInfo {
  sizes: string[];
  enabledSizes: string[];
  weights: Record<string, number>;
  unitsPerCurve: number;
  hasFixedCurve: boolean;
  curveLabel: string;
}

/**
 * Parses the product's TALLE (Column M) and CURVA (Column N, e.g. "2-3-3-1" or "1-2-4-2")
 * to determine enabled size slots in the cart and units per size in the curve.
 */
export function getProductCurveInfo(item: {
  sizeRange?: string;
  sizes?: string[];
  curve?: string;
  division?: string;
  gender?: string;
}): ProductCurveInfo {
  const sizes = getProductSizes(item);
  const rawCurve = (item?.curve || '').trim();

  // If INDUMENTARIA has no explicit curve string, use standard CSV curve by gender
  const effectiveCurve =
    rawCurve && rawCurve.toLowerCase() !== 'libre'
      ? rawCurve
      : (item?.division || '').toUpperCase() === 'INDUMENTARIA'
      ? (item?.gender || '').toUpperCase().includes('FEM') || (item?.gender || '').toUpperCase().includes('WOM')
        ? '2-3-3-1'
        : '1-2-4-2'
      : 'Libre';

  if (effectiveCurve && effectiveCurve.toLowerCase() !== 'libre' && effectiveCurve.includes('-')) {
    const nums = effectiveCurve
      .split('-')
      .map(s => Number(s.trim()))
      .filter(n => !isNaN(n) && n >= 0);

    if (nums.length > 0) {
      const weights: Record<string, number> = {};
      sizes.forEach((sz, idx) => {
        weights[sz] = idx < nums.length ? nums[idx] : 0;
      });
      const enabledSizes = sizes.filter(sz => (weights[sz] ?? 0) > 0);
      const totalUnits = Object.values(weights).reduce((a, b) => a + b, 0);

      return {
        sizes,
        enabledSizes: enabledSizes.length > 0 ? enabledSizes : sizes,
        weights,
        unitsPerCurve: totalUnits > 0 ? totalUnits : 1,
        hasFixedCurve: totalUnits > 0,
        curveLabel: effectiveCurve,
      };
    }
  }

  const weights: Record<string, number> = {};
  sizes.forEach(sz => {
    weights[sz] = 1;
  });

  return {
    sizes,
    enabledSizes: sizes,
    weights,
    unitsPerCurve: 1,
    hasFixedCurve: false,
    curveLabel: 'Libre',
  };
}

export function buildCurveSizeBreakdown(
  item: {
    sizeRange?: string;
    sizes?: string[];
    curve?: string;
    division?: string;
    gender?: string;
  },
  curveCount: number = 1
): Record<string, number> {
  const info = getProductCurveInfo(item);
  const breakdown: Record<string, number> = {};
  if (!info.hasFixedCurve) return breakdown;

  const mult = Math.max(0, curveCount);
  info.enabledSizes.forEach(sz => {
    const w = info.weights[sz] || 0;
    if (w > 0) {
      breakdown[sz] = w * mult;
    }
  });
  return breakdown;
}
