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
          inside MaterialsMine so that fits sit next to the curated data they came from.
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
          The weights are found by a non-negative least-squares fit in log-coefficient space,
          regularized with a curvature (second-difference) penalty on the spectrum — a nonlinear
          Tikhonov approach following Shanbhag (2020). The <em>Smoothness</em> control sets the
          strength of that penalty: larger values give a smoother, better-conditioned spectrum,
          and zero disables the penalty entirely, leaving a plain non-negative least-squares fit.
        </p>
        <p>
          Each data point is weighted by its uncertainty. If your file supplies error columns
          those values are used directly; otherwise the <em>Relative Error</em> setting supplies
          an assumed fractional uncertainty, so that each point is weighted by
          σ = relative error × |E*|.
        </p>
        <p>
          Time–temperature superposition (TTSP) provides the temperature axis. Tri-VE supports
          three shift-factor models: <strong>WLF</strong> (the default, with T<sub>g</sub>,
          C<sub>1</sub>, and C<sub>2</sub> either entered or estimated from your data),
          a <strong>hybrid</strong> WLF/Arrhenius model that adds a low-temperature crossover
          T<sub>L</sub> and an activation energy E<sub>A</sub>, and a <strong>manual</strong>
          model that takes a two-column shift-factor file you supply. Once shift factors are
          known, the same fit is reported against frequency, against temperature, and — through
          the Prony series — against time.
        </p>
      </section>

      <section class="tri-ve-about__section">
        <h2 class="visualize_header-h1">Data format</h2>
        <p>
          Upload a CSV, TSV, or TXT file. Columns are read by position and count; a header row is
          optional and is ignored entirely. The first column is frequency (or temperature, if you
          are starting in the temperature domain), followed by the storage and loss moduli in
          pascals. Three column layouts are accepted:
        </p>
        <ul class="tri-ve-about__list">
          <li>Frequency · E' · E"</li>
          <li>Frequency · E' · E" · Error</li>
          <li>Frequency · E' · E" · E' Error · E" Error</li>
        </ul>
        <p>
          Error is an <strong>absolute standard deviation in Pa</strong> — the same units as the
          moduli, not a fraction or a percent. If E' is 1e9 Pa, a 5% uncertainty is
          <strong>5e7</strong>, not 0.05. Every error value must be greater than zero. Error
          columns set the fit weights (1/σ) and replace the Relative Error setting; they are not
          drawn as error bars.
        </p>
        <p>
          A manual shift-factor file, if you use one, is two columns: temperature and a<sub
            >T</sub
          >.
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
