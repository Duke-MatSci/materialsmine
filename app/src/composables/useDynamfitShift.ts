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
  TC: number | null;
  a_T_ref: number | null;
  chi2_reduced: number | null;
  // The model /fit-shift actually ran, which in manual mode is not the
  // selected transform method — see resolveExtractTransformMethod.
  model?: ShiftFitModel | null;
}

/**
 * Which model /fit-shift should fit, given the selected transform method and
 * the anchors on hand — or null when no fit is possible yet.
 *
 * /fit-shift only accepts 'WLF' or 'hybrid', and each needs its anchor (Tg
 * anchors WLF at a_T == 1; TC is the hybrid WLF/Arrhenius crossover). The
 * 'manual' transform has no fit model of its own, so it borrows whichever
 * model its anchors support, preferring WLF when both are set (fewer free
 * parameters). Sending 'manual' to the route is a 400 — the old code did, and
 * every manual-mode fit died on it.
 */
export function resolveShiftFitModel(
  transformMethod: string,
  Tg: unknown,
  TC: unknown
): ShiftFitModel | null {
  const hasTg = Tg !== null && Tg !== undefined && Tg !== '';
  const hasTC = TC !== null && TC !== undefined && TC !== '';
  if (transformMethod === 'WLF') return hasTg ? 'WLF' : null;
  if (transformMethod === 'hybrid') return hasTC ? 'hybrid' : null;
  if (transformMethod === 'manual') {
    if (hasTg) return 'WLF';
    if (hasTC) return 'hybrid';
  }
  return null;
}

/**
 * The transform_method to send with a /tri-ve/extract/ payload.
 *
 * These are two different questions wearing one name. The radio picks what
 * drives the omega-T transform; transform_method on the extract additionally
 * picks which model curve the shift figure draws, since _build_shift_figure
 * only draws for 'WLF' or 'hybrid'. In manual mode those diverge: the uploaded
 * table does the transforming (supplying shift_file_name makes shiftData win
 * server-side, in both transform directions), while the borrowed fit from
 * resolveShiftFitModel is what the dashed curve should show. So a manual-mode
 * extract names the fitted model and the table still wins.
 *
 * Adopting the fitted model into the radio instead — which is what this
 * replaces — took the user out of manual mode, so the next repaint dropped
 * shift_file_name and asked the server to invert a hybrid model it cannot
 * invert.
 */
export function resolveExtractTransformMethod(
  transformMethod: string,
  fittedModel: ShiftFitModel | null | undefined
): string {
  return fittedModel ?? transformMethod;
}

/**
 * Flatten the fitted shift coefficients into parameter/value rows for CSV
 * export. Null (unfitted/unused) entries are skipped so a WLF export doesn't
 * carry blank Ea/Tc rows. Row labels are display names ('Tc', no subscript
 * available in CSV), not the wire field ('TC').
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
    ['Tc', coefficients.TC],
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
