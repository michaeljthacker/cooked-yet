# CookedYet

**CookedYet** is a tiny, browser-only cooking helper that answers a simple question:

> **“… Cooked Yet?”**

You add a few thermometer readings, and CookedYet fits a simple temperature curve to **predict when your food will be ready** — no accounts, no backend, no guessing.

Live app: **https://cookedyet.mjt.pub**

---

## What CookedYet Is (and Is Not)

**CookedYet is:**
- A lightweight, in-browser tool for estimating doneness
- Based on **actual thermometer readings**, not recipes
- Fast, private, and dependency-free
- Designed for roasts, poultry, pork, fish, and similar cooks

**CookedYet is not:**
- A recipe app
- A replacement for a thermometer
- A food-safety authority
- A “perfect” model of cooking physics

Always trust your thermometer and judgment first.

---

## How It Works (High Level)

1. You enter **time + temperature readings** from your probe
2. The app converts time to **minutes since the first reading**
3. Once you have **3 or more readings**, CookedYet:
   - Fits a **quadratic temperature curve**  
     \[
     T(t) = a + b t + c t^2
     \]
   - Uses **all provided readings** (not just the minimum)
4. The curve is used to:
   - Draw a **predicted glide path**
   - Estimate when your food reaches a **target temperature**
5. Results update immediately as you add new readings

All calculations run **entirely in your browser**.

---

## Features

- **Time + temperature input**
- **Target temperature presets** (beef, poultry, pork, etc.)
- **Custom target temperature**
- **Carryover cooking option**
  - Predicts *pull time* instead of final rest temperature
- **Live prediction chart**
  - Actual readings (points)
  - Predicted glide path (1-minute resolution)
  - Target temperature line
- **Local persistence**
  - Your readings are saved in your browser
  - Refreshing or reopening the tab keeps your data
- **Delete all readings** button for a clean reset

---

## Carryover Cooking

When *Use carryover* is enabled:

```

effective target = desired final temperature − carryover

```

This lets CookedYet estimate **when to pull the food**, not just when it will finish resting.

Default carryover is 5°F, but you can adjust it.

---

## Data & Privacy

- No servers
- No analytics
- No cookies
- No accounts

All data is stored locally using `localStorage` in your browser.  
Clearing readings removes all stored data.

---

## Technical Notes

- Vanilla **HTML / CSS / JavaScript**
- No build step
- No external libraries
- Quadratic regression via ordinary least squares
- Predictions fail gracefully when data is insufficient or inconsistent

This project intentionally favors:
- clarity over cleverness
- simplicity over extensibility
- visibility over abstraction

---

## Known Limitations

- Cooking is noisy; predictions are estimates, not guarantees
- One bad reading can still influence results (though multiple readings reduce impact)
- Assumes a reasonably smooth heating process
- Does not model meat size, oven temperature, airflow, or probe placement

---

## Roadmap / Possible Enhancements

These may or may not be implemented:

- Doneness status messaging  
  (“Not cooked yet”, “Probably rare”, “Pull now”, etc.)
- Visual indicator for “now” and predicted pull point
- Lightweight robust regression to reduce outlier impact
- Optional doneness bands tied to presets
- Minor UI polish and accessibility tweaks

The core goal will remain: **simple, fast, and useful while cooking**.

---

## Disclaimer

CookedYet provides **estimates only**.

Always follow food-safety guidelines and rely on a calibrated thermometer when determining doneness.

---

## License

MIT (or your preferred license)

---

Built as a small, practical tool — not a platform.