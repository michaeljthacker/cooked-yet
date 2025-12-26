## CookedYet — Backlog

## 1. Add disclaimer/expectations text to webpage

Add a visible section on the webpage itself (not just README) clarifying what CookedYet is and isn't:

* "You are the cook; we do not guarantee anything"
* This is a prediction tool, not a replacement for your thermometer or judgment
* Not a food-safety authority
* Based on actual readings, not recipes
* Estimates only - trust your thermometer first

Also improve chart messaging:
* "PULL IT!" / "IT'S COOKED!" messages should clarify these are predictions for the future (in most cases)
* Consider adding time context to predictions

Consider placement: collapsible section, footer note, or info icon near header.

---

## 2. Local persistence

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

* Outlier robustness (weighted least squares, Huber weighting)
* Bayesian priors on heating rate (prior from cooking details; updates with readings)
* Add doneness status line ("Not cooked yet"; "Probably rare now"; etc.)

---