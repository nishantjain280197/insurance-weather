# Address Autocomplete Test Report

**Tested against:** Production build on localhost:3000 (post bug-fix commit `d4a04d0`)
**Feature:** Address autocomplete with Nominatim API + state parsing fix (ISO3166-2-lvl4)

## Test Results: 3/3 Passed

### Test 1: Autocomplete dropdown appears after typing >=3 characters — PASSED
- Typed "16" → no dropdown appeared (correct, <3 chars)
- Typed "1600 Penn" → dropdown appeared with 5 suggestions including location icons
- Suggestions included addresses from PA, OH, TX

| No dropdown with 2 chars | Dropdown with 9 chars |
|---|---|
| ![2 chars](screenshots/screenshot_156fd5b149d04379b13cb201b7527836.png) | ![9 chars](screenshots/screenshot_f3111441d9574d63a9152ed1c133b66d.png) |

### Test 2: Selecting suggestion auto-fills ALL fields and pins map — PASSED
- Clicked "1600 Penn Street, Harrisburg, PA" suggestion
- **Street Address**: "1600 Penn Street" ✓
- **City**: "Harrisburg" ✓
- **State**: "PA" ✓ (previously broken — was showing "Select state")
- **ZIP Code**: "17102" ✓
- **Coordinates**: 40.2721, -76.8933 ✓
- **Map**: Zoomed to Harrisburg with pin marker and popup ✓
- **Dropdown**: Closed after selection ✓

| 🔴 BUG: State empty (before fix) | 🟢 FIX: State = PA (after fix) |
|---|---|
| ![Bug](screenshots/screenshot_d25528fd61624d0a9cea22b869244260.png) | ![Fix](screenshots/screenshot_2179a5e6a122476b90824ac9f4fae079.png) |
| State shows "Select state" despite PA address | State correctly shows "PA" from ISO3166-2-lvl4 |

### Test 3: Full flow — autocomplete → weather search → analytics — PASSED
- Set DOL to 2023-06-15, clicked "Search Weather & Peril Data"
- Analytics loaded: "Harrisburg, PA — 2020-06-15 to 2023-06-15"
- DOL Card: "Date of Loss: 2023-06-15" ✓
- Total Days Analyzed: 1096 ✓
- Days with Perils: 69 (6.3%) ✓
- 4 charts rendered (Monthly Perils with DOL marker, Peril Distribution pie, Temperature Trends, Precipitation & Wind) ✓

![Analytics](screenshots/screenshot_870ab995685141999b1b604c7bb16b88.png)

## Bug Found & Fixed During Testing
**Issue:** State dropdown was not being populated after selecting an autocomplete suggestion.
**Root cause:** Code used `addr.state_code` but Nominatim returns `addr['ISO3166-2-lvl4']` (e.g., "US-PA").
**Fix:** Parse ISO3166-2-lvl4 field, strip "US-" prefix to get 2-letter state code. Commit: `d4a04d0`.
