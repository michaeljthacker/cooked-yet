## Concrete next-step order (so it stays truly simple)

1. **Add localStorage persistence**
   - Save readings, baseDate/time, target/carryover settings
   - Restore on page load
   - Clear on "Clear" button click

2. **(Optional, best ROI)** add a lightweight robust weighting pass to dampen a single weird reading

3. **(Optional)** if you still want it, upgrade solving method (QR) while staying dependency-free

## Completed Steps

✅ **Refactor into `index.html` + `styles.css` + `app.js`**

✅ **Rebrand to CookedYet** (titles, header, branding)

✅ **Quadratic OLS model with glide path chart**
   - Fits T(t) = a + b·t + c·t² using all readings
   - Draws predicted glide path at 1-minute increments
   - Shows target line
   - Hover tooltips on data points and target dot

✅ **Delete-all button** ("Clear" button clears all readings)

✅ **Carryover cooking option**
   - Checkbox to enable/disable
   - Adjustable carryover amount (default 5°F)
   - Predicts pull time vs. final rest time

✅ **Target temperature presets**
   - Beef (rare/medium-rare/medium/medium-well)
   - Poultry, pork, fish, ground meats
   - Custom target option

✅ **Current status display**
   - Shows predicted temperature "now"
   - Displays doneness band

✅ **Icons and PWA support**
   - Full icon set for all platforms
   - Manifest.json for progressive web app

✅ **UI polish**
   - Buy me a coffee button (appears after 5 seconds)
   - Footer with contact info
   - Responsive design
   - Fire emoji for data points
   - Branded messages ("Not cooked yet", "PULL IT!", "IT'S COOKED!")
