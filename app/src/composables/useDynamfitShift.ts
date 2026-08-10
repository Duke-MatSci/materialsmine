/**
 * Pure helpers for the Tri-VE shift-coefficient flow.
 *
 * Kept free of Vue/Vuex so they run under the node jest environment (the
 * client image's jsdom is broken — see the test file headers).
 */

export type ShiftFitModel = 'WLF' | 'hybrid';

export interface ShiftCoefficients {
  C1: number | null;
  C2: number | null;
  Tg: number | null;
  Ea: number | null;
  TL: number | null;
  a_T_ref: number | null;
  chi2_reduced: number | null;
}

/**
 * Which model /fit-shift should fit, given the selected transform method and
 * the anchors on hand — or null when no fit is possible yet.
 *
 * /fit-shift only accepts 'WLF' or 'hybrid', and each needs its anchor (Tg
 * anchors WLF at a_T == 1; TL is the hybrid WLF/Arrhenius crossover). The
 * 'manual' transform has no fit model of its own, so it borrows whichever
 * model its anchors support, preferring WLF when both are set (fewer free
 * parameters). Sending 'manual' to the route is a 400 — the old code did, and
 * every manual-mode fit died on it.
 */
export function resolveShiftFitModel(
  transformMethod: string,
  Tg: unknown,
  TL: unknown
): ShiftFitModel | null {
  const hasTg = Tg !== null && Tg !== undefined && Tg !== '';
  const hasTL = TL !== null && TL !== undefined && TL !== '';
  if (transformMethod === 'WLF') return hasTg ? 'WLF' : null;
  if (transformMethod === 'hybrid') return hasTL ? 'hybrid' : null;
  if (transformMethod === 'manual') {
    if (hasTg) return 'WLF';
    if (hasTL) return 'hybrid';
  }
  return null;
}

/**
 * Flatten the fitted shift coefficients into parameter/value rows for CSV
 * export. Null (unfitted/unused) entries are skipped so a WLF export doesn't
 * carry blank Ea/TL rows.
 */
export function buildShiftCoefficientRows(
  transformMethod: string,
  coefficients: ShiftCoefficients
): { parameter: string; value: string | number }[] {
  const rows: { parameter: string; value: string | number }[] = [
    { parameter: 'transform_method', value: transformMethod },
  ];
  const entries: [string, number | null][] = [
    ['Tg', coefficients.Tg],
    ['TL', coefficients.TL],
    ['C1', coefficients.C1],
    ['C2', coefficients.C2],
    ['Ea', coefficients.Ea],
    ['a_T_ref', coefficients.a_T_ref],
    ['chi2_reduced', coefficients.chi2_reduced],
  ];
  for (const [parameter, value] of entries) {
    if (value !== null && value !== undefined) rows.push({ parameter, value });
  }
  return rows;
}
