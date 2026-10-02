<template>
  <article class="section_teams tri-ve-about">
    <div class="wrapper">
      <header class="u_margin-bottom-med">
        <h1 class="visualize_header-h1 u_margin-top-med">About Tri-VE</h1>
        <p class="md-subheading u--color-grey-sec">
          Tri-domain Viscoelastic interconversion Engine
        </p>
      </header>

      <section class="tri-ve-about__section">
        <h2 class="visualize_header-h1">What Tri-VE does</h2>
        <p>
          Tri-VE fits linear viscoelastic measurements — the kind produced by dynamic mechanical
          analysis (DMA) or a rheometer — to a compact Prony series, and then uses that fit to
          interconvert between the frequency, temperature, and time domains. One master curve in,
          and you get the storage and loss moduli, tan(δ), the relaxation modulus E(t), the
          discrete relaxation spectrum, and the Prony coefficients themselves, all of which can be
          downloaded as CSV.
        </p>
        <p>
          The Prony series is a compact, portable description of a material's viscoelastic
          response, which makes it a convenient hand-off to finite-element solvers, to
          property-prediction pipelines, and to AI-driven materials design workflows. Tri-VE runs
          inside MaterialsMine so that curated DMA data can be analyzed directly. (Coming soon!)
        </p>
      </section>

      <section class="tri-ve-about__section">
        <h2 class="visualize_header-h1">The fitting method</h2>
        <p>
          The underlying model is a generalized Maxwell model: the relaxation modulus is
          represented as a sum of exponential (Prony) terms, each with its own weight
          E<sub>i</sub> and relaxation time τ<sub>i</sub>. The relaxation times are spread across
          the span of your data; the number of terms defaults to roughly three per decade of
          frequency and can be overridden with the slider.
        </p>
        <p>
          Throughout Tri-VE, <em>E</em> is used as a generic symbol for modulus. The method itself
          is agnostic to input modulus: the same fit and interconversions apply
          equally to the shear modulus (G), the bulk modulus (K), or Young's modulus (E). Supply
          whichever your instrument reports, and read E', E", E(t), and E<sub>i</sub> in the
          plots and tables as that modulus. Currently all example files are Young's modulus except
          where indicated otherwise.
        </p>
        <p>
          Time–temperature superposition (TTSP) provides the temperature axis. Tri-VE supports
          three shift-factor models: <strong>WLF</strong> (with T<sub>g</sub> in °C,
          C<sub>1</sub>, and C<sub>2</sub> either entered or estimated from your data),
          a <strong>hybrid</strong> WLF/Arrhenius model that adds a low-temperature crossover
          T<sub>C</sub> (°C) and an activation energy E<sub>A</sub> (kJ/mol), and a
          <strong>manual</strong> model that takes a two-column shift-factor file you supply.
          Once shift factors are known, the same fit is reported against frequency, against
          temperature, and — through the Prony series — against time. A good way to choose
          T<sub>g</sub> is from your domain knowledge of the polymer system. In the temperature
          domain, one way to estimate T<sub>C</sub> is the peak temperature of the loss modulus curve,
          and this value is automatically suggested. You can use it, or a somewhat lower
          temperature with good effect. If you are working in the frequency domain, choose a number below
          T<sub>g</sub> somewhat, but we lack an anchor to choose it automatically for you, so
          you may have to try a few options to get a good fit.
        </p>
        <p>
          Each data point is weighted by its uncertainty. If your file supplies error columns
          those values set the point-to-point weighting, and an <em>Error Scale</em> setting
          multiplies them uniformly — 1.0 uses them exactly as supplied, larger values relax the
          fit if your instrument understates its uncertainty. Otherwise the
          <em>Relative Error</em> setting supplies an assumed uncertainty as a percentage, so
          that each point is weighted by
          <span class="tri-ve-about__eq-display">
            <span class="tri-ve-about__eq">σ = (relative error ÷ 100) × |E*|.</span>
          </span>
          Either way the errors are read as standard deviations, and χ<sup>2</sup> is the sum
          of the squared, error-weighted residuals.
        </p>
        <p>
          The roughness of the fitted spectrum is measured by its <em>curvature</em>, the mean
          squared second derivative of <span class="tri-ve-about__eq">H = ln E<sub>i</sub></span> with respect to
          <span class="tri-ve-about__eq">ln τ</span>, built from the second differences Δ<sup>2</sup> along the relaxation grid:
          <span class="tri-ve-about__eq-display">
            <span class="tri-ve-about__eq">⟨H″<sup>2</sup>⟩ = Σ(Δ<sup>2</sup> ln E<sub>i</sub>)<sup>2</sup>·(n−1)<sup>3</sup>/L<sup>4</sup>,</span>
          </span>
          where n is the number of Prony terms and
          <span class="tri-ve-about__eq">L = ln(τ<sub>max</sub>/τ<sub>min</sub>)</span> the span of the relaxation grid. The
          Prony weights E<sub>i</sub> are found by a regularized least-squares fit in
          log-coefficient space, which keeps them positive. It minimizes
          <span class="tri-ve-about__eq-display">
            <span class="tri-ve-about__eq">V = χ<sup>2</sup> + s<sup>2</sup>·dof·⟨H″<sup>2</sup>⟩,</span>
          </span>
          a nonlinear Tikhonov approach adapted from Shanbhag (2020). Here s is the
          <em>Smoothness</em> setting and dof the degrees of freedom (data values fitted minus
          parameters fitted). Larger values of s give a smoother, better-conditioned spectrum,
          and zero disables the penalty entirely, leaving a plain non-negative least-squares fit.
          Because ⟨H″<sup>2</sup>⟩ is a mean per unit <span class="tri-ve-about__eq">ln τ</span> and dof scales the penalty with
          the amount of data, <em>Smoothness</em> has a consistent meaning across datasets with
          different spans, data densities, and numbers of Prony terms.
        </p>
        <p>
          Reading the errors as standard deviations makes the coefficient posterior
          <span class="tri-ve-about__eq-display">
            <span class="tri-ve-about__eq">π&thinsp;(E<sub>i</sub> | s<sup>2</sup>, data) ∝ exp(−V/2).</span>
          </span>
          On a smoothed fit the readout reports three numbers. <em>Misfit</em> is
          <span class="tri-ve-about__eq">χ<sup>2</sup>/ν</span>, where ν is the effective degrees of freedom: data values fitted
          minus the number of well-determined parameters of MacKay (1992).
          <em>Curvature</em> is ⟨H″<sup>2</sup>⟩. <em>Surprisal</em> is
          <span class="tri-ve-about__eq">−log π&thinsp;(s<sup>2</sup> | data)</span>, the negative log posterior of s<sup>2</sup> with
          the coefficients integrated out, under an exponential prior on s<sup>2</sup>. You can
          choose a good error scaling or relative error by, at zero smoothing, finding the value
          that sets misfit to 1.0, or directly multiply the current setting by √misfit.
          You can choose a good smoothing by finding the value that minimizes surprisal given
          a constant error setting.
        </p>
        <p>
          When smoothing is on, the fitted curves carry a shaded ±1σ band in the fit line's
          color, and the spectrum dots carry error bars. Both come from the second
          derivative of V at its minimum. The band is a credible interval on the curve itself:
          it shows how tightly your error inputs and the <em>Smoothness</em> setting pin down
          the fit, not how far the fit may sit from the truth. Smoothing bias is not included,
          so at strong smoothing the true curve can fall outside the band more often than the
          label suggests. With <span class="tri-ve-about__eq"><em>Smoothness</em> = 0</span> there are no bands.
        </p>
        <p>
          The frequency-domain plots also carry a second, wider ±1σ band in the data's color.
          This is a prediction interval: where a new measurement would be expected to land. It
          combines the curve's uncertainty with your stated measurement error. It is not drawn
          on E(t) or the discrete spectrum, which are not measured directly.
        </p>
        <p>
          On a smoothed fit the coefficient table and its CSV download gain two columns,
          <code>E_i_lower</code> and <code>E_i_upper</code>: the ±1σ range of each coefficient
          in Pa, the same range the error bars on the spectrum plot show. With smoothing off
          these columns are absent.
        </p>
        <p>
          The fitted curves are drawn one decade past your measured window on each side, showing
          an extrapolation of the Prony series as it would be exported.
          The plotted E(t) is the decaying part only (the
          long-term modulus is left out), so past the last relaxation time it heads to zero
          rather than to the plateau. The vertical axes are set from the measured window, so the
          tails can run off the plot.
        </p>
      </section>

      <section class="tri-ve-about__section">
        <h2 class="visualize_header-h1">Data format</h2>
        <p>
          Upload a CSV, TSV, or TXT file. Columns are read by position and count; a header row is
          optional and is ignored entirely. The first column is frequency (or temperature
          in °C, if you are starting in the temperature domain), followed by the storage and loss
          moduli. Three column layouts are accepted:
        </p>
        <ul class="tri-ve-about__list">
          <li>Frequency · E' · E"</li>
          <li>Frequency · E' · E" · Error</li>
          <li>Frequency · E' · E" · E' Error · E" Error</li>
        </ul>
        <p>
          Tri-VE does not inspect the units of your data. Frequency is assumed to be angular
          frequency in rad/s: the values are used as given, so a file in Hz yields relaxation
          times, and an E(t) time axis, 2π times too long. Multiply by 2π before uploading if
          your instrument reports Hz. A temperature sweep is treated as measured at 1 rad/s. The
          moduli are passed through unchanged: plots and tables label them E and Pa, but they
          keep whatever units, and whatever kind of modulus, you supply.
        </p>
        <p>
          Error is an <strong>absolute standard deviation in Pa</strong> — the same units as the
          moduli, not a fraction or a percent. If E' is 1e9 Pa, a 5% uncertainty is
          <strong>5e7</strong>, not 0.05. Every error value must be greater than zero. Error
          columns set the fit weights <span class="tri-ve-about__eq">(1/σ)</span>, and the Relative Error setting becomes an Error
          Scale that multiplies them. They are not drawn as error bars on the experimental
          points, but they feed the ±1σ bands drawn around the fit.
        </p>
        <p>
          A manual shift-factor file, if you use one, is two columns: temperature in °C and
          a<sub>T</sub>. All temperatures entered or uploaded anywhere in Tri-VE are in degrees
          Celsius.
        </p>
        <p class="tri-ve-about__downloads">
          <a class="btn-text btn--noradius" href="/dynamfit-template.tsv" download>
            Download data template
          </a>
          <a class="btn-text btn--noradius" href="/dynamfit-template-error.tsv" download>
            Download template with error columns
          </a>
        </p>
      </section>

      <section class="tri-ve-about__section">
        <h2 class="visualize_header-h1">References</h2>
        <ol class="tri-ve-about__refs">
          <li>
            Bradshaw, R. D. and Brinson, L. C. (1997) "A Sign Control Method for Fitting and
            Interconverting Material Functions for Linearly Viscoelastic Solids,"
            <em>Mechanics of Time-Dependent Materials</em>, 1(1), pp. 85–108.
            <a href="https://doi.org/10.1023/A:1009772018066" target="_blank" rel="noopener">
              https://doi.org/10.1023/A:1009772018066
            </a>
          </li>
          <li>
            Shanbhag, S. (2020) "Relaxation Spectra Using Nonlinear Tikhonov Regularization with a
            Bayesian Criterion," <em>Rheologica Acta</em>, 59(8), pp. 509–520.
            <a href="https://doi.org/10.1007/s00397-020-01212-w" target="_blank" rel="noopener">
              https://doi.org/10.1007/s00397-020-01212-w
            </a>
          </li>
          <li>
            MacKay, D. J. C. (1992) "Bayesian Interpolation," <em>Neural Computation</em>, 4(3),
            pp. 415–447.
            <a href="https://doi.org/10.1162/neco.1992.4.3.415" target="_blank" rel="noopener">
              https://doi.org/10.1162/neco.1992.4.3.415
            </a>
          </li>
          <li>
            Ferry, J. D. (1980) <em>Viscoelastic Properties of Polymers</em>, 3rd ed., Wiley.
          </li>
        </ol>
      </section>

      <p class="u_margin-top-med">
        <router-link class="btn btn--primary u--b-rad" :to="{ name: 'TriVE' }">
          Open Tri-VE
        </router-link>
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';

// Component name for debugging
defineOptions({
  name: 'TriVEAbout',
});

// This app has no route-title machinery, so the page sets (and restores) its own.
let previousTitle = '';
onMounted(() => {
  previousTitle = document.title;
  document.title = 'About Tri-VE — MaterialsMine';
});
onBeforeUnmount(() => {
  if (previousTitle) document.title = previousTitle;
});
</script>

<style scoped>
.tri-ve-about__section {
  margin-bottom: 2rem;
  max-width: 60rem;
}

.tri-ve-about__section p {
  margin-bottom: 0.75rem;
}

/* Inline equations break as a unit, never mid-expression. */
.tri-ve-about__eq {
  white-space: nowrap;
}

/* Lengthy equations get a centered line of their own. A span, since a block
   element cannot sit inside the paragraph the sentence continues in. */
.tri-ve-about__eq-display {
  display: block;
  margin: 0.5rem 0;
  text-align: center;
}

.tri-ve-about__list,
.tri-ve-about__refs {
  margin: 0 0 0.75rem 1.5rem;
}

.tri-ve-about__list li,
.tri-ve-about__refs li {
  margin-bottom: 0.5rem;
}

.tri-ve-about__list {
  list-style: disc;
}

.tri-ve-about__refs {
  list-style: decimal;
}

.tri-ve-about__downloads {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
</style>
