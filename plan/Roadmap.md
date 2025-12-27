## Next Step Priorities

_No planned future work._

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

✅ **Disclaimer and expectations**
   - Prominent disclaimer banner with dismiss functionality
   - Persists dismissal to localStorage
   - Updated chart hover messages to show predictions with timestamps
   - Updated pill messages to clarify predictions ("Predicted: pull at [time], then let it rest")
   - Footer disclaimer with info icon and hover tooltip
   - Fixed manifest.json icon paths

✅ **Local persistence**
   - Saves readings, baseDate, and target/carryover settings to localStorage
   - Restores state on page load
   - Clears localStorage on "Clear" button click
   - Consistent 12-hour time format (AM/PM) throughout UI
