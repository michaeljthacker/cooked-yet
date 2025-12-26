## CookedYet — rough plan (updated)

### Goal

A tiny, browser-only tool that:

* accepts thermometer readings (time + temp)
* fits a **quadratic** temperature curve using **all** readings (3+)
* predicts when the meat reaches a target (with optional carryover)
* shows a simple chart including a predicted glide path
* persists readings locally (so you can close the tab and come back)

No backend, no bundler, no dependencies.

---

## Branding and first updates (do these first)

1. **Rebrand**

   * Product name: **CookedYet**
   * URL/subdomain: `cookedyet.mjt.pub` (GitHub Pages)
   * Replace page title and in-app header:

     * Title: `CookedYet`
     * Main header: `CookedYet` (or later the dynamic “... Cooked Yet” line)

2. **Refactor into normal files**

   * `index.html`
   * `styles.css`
   * `app.js`
   * Keep it “vanilla” (no build step). Just `<link>` + `<script defer>`.

These two changes set you up to iterate without the single-file getting messy.

---

## MVP functionality

### Inputs

* Add reading:

  * `Time (HH:MM)` + `Temp (°F)`
  * internally convert to minutes since first reading (`t=0` at first reading)
* Require **3+ readings** to fit/predict
* Target selection:

  * Preset dropdown (beef/poultry/pork/etc.) + “Custom”
  * “Desired final temp” numeric field

### Carryover option

* Checkbox: **Use carryover**
* Numeric field: **Carryover °F** (default 5)
* Effective target:

  * carryover off → `target_eff = final_target`
  * carryover on → `target_eff = final_target − carryover`

### Model + prediction (quadratic, uses all data)

* Model: `T(t) = a + b·t + c·t²`
* Fit via OLS using **all readings** (not just 3)
* Predict done time by solving:

  * `c t² + b t + (a − target_eff) = 0`
  * choose smallest real root **after** the last observed time
* Basic failure states:

  * fit fails / singular → “Fit failed”
  * no real root / not heating → “No ETA yet” / “Not heating”

### Chart

* Plot raw readings as points
* Once 3+ readings exist:

  * draw target line at `target_eff`
  * draw **predicted glide path** at **1-minute increments**

    * from `t=0` through `max(lastReadingT, ETA+10)`
  * keep chart minimal (canvas)

---

## Local persistence

Add localStorage so readings survive refresh / closing tab.

### Behavior

* On every add/remove:

  * save `readings[]`, `baseDate/time`, and current target/carryover settings (optional)
* On load:

  * restore if present and re-render
* Add a **Delete all readings** button:

  * clears readings in memory
  * removes localStorage keys

### Data design (simple + future-proof enough)

* Store times as:

  * either absolute “HH:MM” strings + computed minutes
  * or store minutes + a stored `baseTimeStr`
* Store a small JSON object, e.g.:

  * `cookedyet.v1 = { baseTimeStr, readings:[{timeStr,temp}], targetFinal, useCarryover, carryoverF }`

---

## The “NxN” improvement (still quadratic, still no bundler)

### Why you’re right to want this

You are already using all data points in the *design matrix sense* even with a 3×3 system — but the **solver** is still only solving a 3-parameter model. That’s correct for quadratic regression.

The real concern you raised is not “3×3 can’t use all data”; it’s:

* **a single outlier can distort OLS**
* **cook data is noisy**
* **adding more readings should reduce the impact of a single wonky point**

That’s true. The fix is less about “NxN vs 3×3” and more about:

1. better numerical approach, and/or
2. outlier-robustness.

### What we can do *without dependencies*

Keep the model quadratic (3 parameters), but upgrade the math path in a way that is:

* still vanilla JS
* still small
* still “Copilot in an hour-ish”

#### Suggested path forward (limited added work)

**Step 1 — implement a small general-purpose least squares solve via QR or Gaussian elimination**

* Still solve for 3 parameters, but build it in a more general shape:

  * `X` is N×3
  * solve in a numerically safer way than explicitly inverting `(X'X)`
* Two “lightweight” choices:

**Option A: Gaussian elimination on the 3×3 normal equations (current approach)**

* Lowest work, already done
* Uses all readings via sums
* Most fragile to scaling / conditioning, but usually OK here

**Option B: Build X (N×3) and solve with a tiny QR decomposition (recommended if you want “better” without libraries)**

* Slightly more code, but still manageable
* Improves numerical stability vs normal equations
* Still no bundler

If you want to keep it very small, you can still do a *general* Gaussian elimination routine that works on any square matrix, but you’ll still end up reducing to 3×3 for the quadratic coefficients unless you add other features. The advantage would mainly be code cleanliness / reusability, not statistical power.

**Step 2 — add one outlier mitigation (bigger payoff than NxN)**
If your real worry is “one wonky reading,” the simplest high-value additions are:

* **Weighted least squares (WLS)** with a simple rule:

  * downweight points that imply an extreme jump from the prior trend
* or **robust regression via one-pass Huber weighting**:

  * fit OLS → compute residuals → compute weights → refit once

These are still pretty lightweight and directly target your concern.

---

## “Potential / later” ideas (from your note)

Keep as optional backlog so the core stays shippable:

1. **Incremental / Bayesian flavor**

   * Start with a simple prior on slope or heating rate
   * Update with readings over time
   * Could be “fun,” but risk: more knobs than value for an MVP

2. **Use cook temp / oven temp as a rough prior**

   * In principle: higher oven temp → faster slope, earlier plateau
   * In practice: too many confounders (meat size, starting temp, convection, resting, probe placement)
   * Useful only if kept *very* coarse (e.g., “low/med/high heat”)

3. **Doneness status line for the CookedYet vibe**

   * “Not cooked yet”
   * “Probably rare now”
   * “Approaching target”
   * “Pull now”
   * This can be purely derived from:

     * current predicted temp at “now”
     * target preset bands

---