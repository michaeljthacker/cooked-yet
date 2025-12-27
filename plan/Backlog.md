## CookedYet — Backlog

## 1. Local persistence

Add localStorage so readings survive refresh / closing tab.

### Implementation

* On every add/remove:
  * save `readings[]`, `baseDate/time`, and current target/carryover settings
* On load:
  * restore if present and re-render
* "Clear" button:
  * Already clears readings in memory
  * Need to add: remove localStorage keys

### Data design

* Store times as:

  * either absolute “HH:MM” strings + computed minutes
  * or store minutes + a stored `baseTimeStr`
* Store a small JSON object, e.g.:

  * `cookedyet.v1 = { baseTimeStr, readings:[{timeStr,temp}], targetFinal, useCarryover, carryoverF }`

---

## Optional / Future enhancements

* Reset Target preset option dropdown to "Custom" anytime the user manually changes the Desired temperature.
* Outlier robustness (weighted least squares, Huber weighting)
* Bayesian priors on heating rate (prior from cooking details; updates with readings)
* Add doneness status line ("Not cooked yet"; "Probably rare now"; etc.)

---