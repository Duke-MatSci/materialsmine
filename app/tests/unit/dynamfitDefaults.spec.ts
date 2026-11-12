/**
 * Pure helper tests — no DOM needed, and the jsdom environment cannot boot in
 * the client image (canvas native binding is unbuilt there).
 *
 * @jest-environment node
 */
import * as defaults from '@/composables/useDynamfitDefaults';
import {
  computeDefaultPronyTerms,
  displayedPronyTerms,
  effectivePronyMax,
  fractionToPercent,
  percentToFraction,
  PERCENT_INPUT_STEP,
  PRONY_TERMS_MAX,
  PRONY_TERMS_PER_DECADE,
  pronyRequestFields,
  pronyTermsForLoadedFile,
  pronyTooltipLeft,
  RELATIVE_ERROR_DEFAULT_PERCENT,
  SMOOTHNESS_DEFAULT,
  SMOOTHNESS_MAX,
  SMOOTHNESS_MIN,
  SMOOTHNESS_STEP,
} from '@/composables/useDynamfitDefaults';

// Rows spanning `decades` decades of frequency, three columns, tab separated.
const rowsSpanning = (decades: number, points = 12, sep = '\t'): string[] => {
  const rows: string[] = [];
  for (let i = 0; i < points; i++) {
    const f = Math.pow(10, (decades * i) / (points - 1));
    rows.push([f, 1e9, 1e7].join(sep));
  }
  return rows;
};

describe('computeDefaultPronyTerms', () => {
  it('uses about three terms per decade of span', () => {
    expect(computeDefaultPronyTerms(rowsSpanning(7).join('\n'))).toBe(21);
    expect(PRONY_TERMS_PER_DECADE).toBe(3);
  });

  it('honours a caller-supplied terms-per-decade', () => {
    expect(computeDefaultPronyTerms(rowsSpanning(4).join('\n'), 5)).toBe(20);
  });

  it('clamps a narrow span up to the minimum', () => {
    expect(computeDefaultPronyTerms(rowsSpanning(0.5).join('\n'))).toBe(5);
  });

  it('clamps a very wide span down to the server maximum', () => {
    expect(computeDefaultPronyTerms(rowsSpanning(60).join('\n'))).toBe(100);
  });

  it('ignores a header row', () => {
    const withHeader = ['Frequency\tE_storage\tE_loss', ...rowsSpanning(7)].join('\n');
    expect(computeDefaultPronyTerms(withHeader)).toBe(21);
  });

  it('tolerates CRLF line endings and trailing blank lines', () => {
    expect(computeDefaultPronyTerms(rowsSpanning(7).join('\r\n') + '\r\n\r\n')).toBe(21);
  });

  it('tolerates comma and semicolon separators', () => {
    expect(computeDefaultPronyTerms(rowsSpanning(7, 12, ',').join('\n'))).toBe(21);
    expect(computeDefaultPronyTerms(rowsSpanning(7, 12, ';').join('\n'))).toBe(21);
  });

  it('returns null when there are fewer than two usable rows', () => {
    expect(computeDefaultPronyTerms('')).toBeNull();
    expect(computeDefaultPronyTerms('Frequency\tE_storage\tE_loss')).toBeNull();
    expect(computeDefaultPronyTerms('Frequency\tE\n1\t1e9')).toBeNull();
  });

  it('returns null when every row shares one value, so the span is zero', () => {
    expect(computeDefaultPronyTerms('1\t1e9\n1\t1e9\n1\t1e9')).toBeNull();
  });

  it('skips non-positive values that log10 cannot use', () => {
    expect(computeDefaultPronyTerms('0\t1e9\n-1\t1e9\n1\t1e9')).toBeNull();
  });
});

describe('pronyTermsForLoadedFile', () => {
  // Positive temperatures (10 to 150 °C): read as a frequency span they would
  // give the 5-term floor, so only the domain can tell this file apart.
  const temperatureRamp = Array.from({ length: 15 }, (_, i) => `${10 + 10 * i}\t1e9\t1e7`)
    .join('\n');

  it('leaves the grid size of a temperature-domain file unset for the server to size', () => {
    // A size left by the previous file must not carry over to the next one.
    expect(pronyTermsForLoadedFile(temperatureRamp, 'temperature')).toBeNull();
    expect(pronyTermsForLoadedFile('', 'temperature')).toBeNull();
  });

  it('keeps three terms per decade for a frequency-domain file', () => {
    expect(pronyTermsForLoadedFile(rowsSpanning(7).join('\n'), 'frequency')).toBe(21);
  });

  it('leaves a frequency-domain file with no usable span unset', () => {
    expect(pronyTermsForLoadedFile('', 'frequency')).toBeNull();
  });
});

describe('pronyRequestFields', () => {
  it('sends a grid size that is set, to be fitted as given', () => {
    expect(pronyRequestFields(80)).toStrictEqual({ number_of_prony: 80 });
    expect(pronyRequestFields(21)).toStrictEqual({ number_of_prony: 21 });
  });

  it('omits the key when the grid size is unset, so the server sizes the grid', () => {
    // An undefined-valued key would pass toEqual({}); the key must be absent.
    expect(pronyRequestFields(null)).toStrictEqual({});
    expect(Object.keys(pronyRequestFields(null))).toEqual([]);
  });
});

describe('displayedPronyTerms', () => {
  it('shows the grid size the user set, whatever the server reported', () => {
    expect(displayedPronyTerms(80, 55)).toBe(80);
    expect(displayedPronyTerms(80, null)).toBe(80);
    expect(displayedPronyTerms(5, undefined)).toBe(5);
  });

  it('shows the size the server reported while the grid size is unset', () => {
    expect(displayedPronyTerms(null, 55)).toBe(55);
    expect(displayedPronyTerms(null, 1)).toBe(1);
  });

  it('caps a reported size above the static maximum to it', () => {
    expect(displayedPronyTerms(null, 250)).toBe(PRONY_TERMS_MAX);
  });

  it('falls back to the static maximum when unset with no usable reported size', () => {
    // null on the temperature preview, undefined before the first response;
    // a non-integer or a count below one term is no size at all.
    for (const reported of [null, undefined, NaN, 12.5, 0, -3]) {
      expect(displayedPronyTerms(null, reported)).toBe(PRONY_TERMS_MAX);
    }
  });
});

describe('effectivePronyMax', () => {
  it('stops the slider at the term count the server says the data can carry', () => {
    expect(effectivePronyMax(30, 10)).toBe(30);
    expect(effectivePronyMax(30, 30)).toBe(30);
  });

  it('falls back to the static maximum when there is no usable server cap', () => {
    // null on the temperature preview, undefined before the first response;
    // a non-integer or a count below one term is no cap at all.
    expect(PRONY_TERMS_MAX).toBe(100);
    for (const cap of [null, undefined, NaN, 12.5, 0, -3]) {
      expect(effectivePronyMax(cap, 10)).toBe(PRONY_TERMS_MAX);
    }
  });

  it('clamps a server cap above the static maximum down to it', () => {
    expect(effectivePronyMax(250, 10)).toBe(PRONY_TERMS_MAX);
  });

  it('never drops the maximum below the current value', () => {
    // A range input whose max falls under its value clamps the thumb without
    // firing input, so v-model and the store would silently disagree.
    expect(effectivePronyMax(30, 80)).toBe(80);
  });

  it('treats an emptied or non-numeric current value as unconstraining', () => {
    // v-model.number hands back '' for an emptied input.
    expect(effectivePronyMax(30, NaN)).toBe(30);
    expect(effectivePronyMax(30, '' as unknown as number)).toBe(30);
  });

  it('allows the degenerate one-term slider', () => {
    expect(effectivePronyMax(1, 1)).toBe(1);
  });
});

describe('pronyTooltipLeft', () => {
  it('places the tooltip proportionally along a track running from 1 to max', () => {
    expect(pronyTooltipLeft(1, 30)).toBe(0);
    expect(pronyTooltipLeft(30, 30)).toBe(100);
    expect(pronyTooltipLeft(11, 21)).toBe(50);
    expect(pronyTooltipLeft(34, 100)).toBeCloseTo(100 / 3, 10);
  });

  it('pins the tooltip to the start when the track has no length', () => {
    expect(pronyTooltipLeft(1, 1)).toBe(0);
    expect(pronyTooltipLeft(1, 0)).toBe(0);
  });

  it('keeps the tooltip on the track for a value outside 1..max', () => {
    expect(pronyTooltipLeft(40, 30)).toBe(100);
    expect(pronyTooltipLeft(0, 30)).toBe(0);
  });
});

describe('smoothness setting', () => {
  it('defaults to the raw knob value the bundled curves were calibrated for', () => {
    // 0.3 sits within 0.06 nats of the total surprisal minimum (s = 0.313)
    // over the seven bundled master curves at 1% relative error.
    expect(SMOOTHNESS_DEFAULT).toBe(0.3);
  });

  it('is entered as the raw knob, with no percent default left to convert', () => {
    // The API has always taken the raw value; a percent constant would invite
    // the consumer to keep sending percentToFraction of it.
    expect('SMOOTHNESS_DEFAULT_PERCENT' in defaults).toBe(false);
  });

  it('offers 0 to 10 in steps of 0.1', () => {
    expect(SMOOTHNESS_MIN).toBe(0);
    expect(SMOOTHNESS_MAX).toBe(10);
    expect(SMOOTHNESS_STEP).toBe(0.1);
  });

  it('puts the default on the step grid and within bounds', () => {
    const steps = (SMOOTHNESS_DEFAULT - SMOOTHNESS_MIN) / SMOOTHNESS_STEP;
    expect(Math.abs(steps - Math.round(steps))).toBeLessThan(1e-9);
    expect(SMOOTHNESS_DEFAULT).toBeGreaterThanOrEqual(SMOOTHNESS_MIN);
    expect(SMOOTHNESS_DEFAULT).toBeLessThanOrEqual(SMOOTHNESS_MAX);
  });
});

describe('percent conversion for the fit settings', () => {
  it('sends the relative error default the fit was calibrated for', () => {
    expect(percentToFraction(RELATIVE_ERROR_DEFAULT_PERCENT)).toBe(0.01);
  });

  it('keeps a stepped percentage free of binary noise', () => {
    // 4.1 / 100 is 0.041000000000000004 unrounded, which then shows up in the
    // request payload and in anything that stringifies it.
    expect(percentToFraction(4 + PERCENT_INPUT_STEP)).toBe(0.041);
    expect(percentToFraction(0.3)).toBe(0.003);
  });

  it('round-trips every value the steppers can reach', () => {
    for (let percent = 0; percent <= 200; percent += PERCENT_INPUT_STEP) {
      const p = Math.round(percent * 10) / 10;
      expect(fractionToPercent(percentToFraction(p))).toBe(p);
    }
  });

  it('passes a cleared input straight through instead of reading it as zero', () => {
    // v-model.number hands back '' for an empty field; turning that into 0
    // would silently claim the data is exact.
    expect(percentToFraction(NaN)).toBeNaN();
    expect(percentToFraction('' as unknown as number)).toBe('');
    expect(fractionToPercent('' as unknown as number)).toBe('');
  });
});
