# Address Autocomplete Test Plan

Focus: Verify the new address autocomplete feature in WeatherSearch.jsx

## Test 1: Autocomplete dropdown appears when typing >=3 characters
**Steps:**
1. Login as admin@weatherportal.com / Admin@123
2. On Weather Search tab, click the street address field
3. Type "16" — wait 1 second
4. Verify NO dropdown appears (less than 3 chars)
5. Type "00 Penn" (total: "1600 Penn") — wait 1 second
6. Verify a dropdown appears below the input with 1-5 suggestions containing location pin icons

**Pass criteria:**
- After typing "16": no `<ul>` dropdown visible below input
- After typing "1600 Penn": dropdown appears with at least 1 suggestion containing "Pennsylvania" in the text

**Fail if:**
- Dropdown appears with only 2 characters
- No dropdown appears after typing "1600 Penn" and waiting >1s
- Dropdown shows empty or garbled text

## Test 2: Selecting a suggestion auto-fills all fields and pins map
**Steps:**
1. With dropdown visible from Test 1, click the first suggestion (should be something like "1600 Pennsylvania Avenue")
2. Verify:
   - Street address field is filled (not empty, not the raw display_name)
   - City field is filled (e.g., "Washington")
   - State dropdown shows a valid 2-letter state code (e.g., "DC" or nearby state)
   - ZIP code field has a value (e.g., "20500" or similar)
   - Map zooms to the selected location with a pin marker
   - Coordinates text appears below "Locate on Map" button (approx lat 38.8, lon -77.0 for DC area)

**Pass criteria:**
- All 4 form fields populated with non-empty values after selection
- Map shows pin at new location (not default US overview)
- Coordinates line shows values near expected location
- Dropdown disappears after selection

**Fail if:**
- Any of the 4 fields remain empty after selection
- Map stays at default zoom (whole US visible)
- Coordinates don't appear
- Dropdown stays open after clicking a suggestion

## Test 3: Full flow — autocomplete to weather search to analytics
**Steps:**
1. After auto-filled address from Test 2, set Date of Loss to 2023-06-15
2. Click "Search Weather & Peril Data"
3. Verify analytics loads with DOL card showing "2023-06-15" and Total Days Analyzed ~1096

**Pass criteria:**
- Analytics tab activates with DOL card "Date of Loss: 2023-06-15"
- Total Days Analyzed between 1090-1100
- At least one chart renders with data

**Fail if:**
- Error message appears (would indicate coords weren't properly set from autocomplete)
- Analytics shows empty state
- Total days is wrong (would indicate date calculation issue)
