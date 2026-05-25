# WeatherShield E2E Test Plan

## Test 1: Login with default admin credentials
**Steps:**
1. Navigate to http://localhost:5173/ — should redirect to /login
2. Verify login page shows animated weather theme (rain drops, storm clouds visible)
3. Enter email: `admin@weatherportal.com`, password: `Admin@123`
4. Click "Sign In"

**Pass criteria:**
- Login page renders with "WeatherShield" title and "Insurance Weather Intelligence Portal" subtitle
- After login, redirected to dashboard showing "Weather Peril Search" heading
- Navbar shows email "admin@weatherportal.com" with role "admin"
- All 4 tabs visible: "Weather Search", "History", "Analytics", "User Management"

**Fail if:**
- Login page shows error or blank screen
- After login, still on login page or shows error
- "User Management" tab is missing (would mean role-based access is broken)

## Test 2: Weather search with geocoding and map pin
**Steps:**
1. On Weather Search tab, enter City: `Houston`, State: `TX`, ZIP: `77001`
2. Click "Locate on Map" button
3. Verify map zooms to Houston and shows a pin marker
4. Verify coordinates text appears below the button (approximately lat 29.7, lon -95.3)
5. Set Date of Loss to `2023-06-15`
6. Click "Search Weather & Peril Data"

**Pass criteria:**
- After geocoding: map shows pin near Houston, TX. Coordinates shown (approx 29.7xxx, -95.3xxx)
- After search: automatically switches to Analytics tab (Dashboard.jsx:14-16)
- Loading spinner shows "Fetching 3 Years of Weather Data..." during API call

**Fail if:**
- "Locate on Map" shows error or map doesn't move
- Coordinates don't appear
- Search button stays disabled or returns error
- Tab doesn't switch to Analytics after search completes

## Test 3: Analytics dashboard — DOL highlight and charts
**Steps:**
1. After Test 2 completes, verify Analytics tab is active
2. Check for red "Date of Loss: 2023-06-15" highlight card
3. Verify DOL card shows weather details (temperature range, precipitation, wind gust)
4. Verify 4 stat cards are present (Total Days Analyzed, Days with Perils, Avg Temperature, Max Wind Gust)
5. Verify "Total Days Analyzed" shows approximately 1096 (3 years = ~1096 days)
6. Verify at least 2 charts render (Monthly Peril Events bar chart, Temperature Trends)
7. Scroll down to "All Peril Events" section — verify peril filter dropdown exists

**Pass criteria:**
- DOL card has red/orange gradient background with date "2023-06-15"
- DOL card shows 4 weather metric boxes (Weather, Temperature, Precipitation, Max Wind Gust) with non-zero values
- "Total Days Analyzed" stat shows value between 1090-1100
- Bar chart and temperature chart are visible with data points
- Peril filter dropdown contains options like "Hail", "Wind", "Thunderstorm"

**Fail if:**
- Analytics shows "No analytics data" empty state
- DOL card is missing or shows wrong date
- Charts are empty or don't render
- Total days count is wildly wrong (not ~1096)

## Test 4: Search history — save and recall
**Steps:**
1. Click "History" tab in navbar
2. Verify the Houston search from Test 2 appears in history list
3. Verify history entry shows: address containing "Houston", "TX", date of loss "2023-06-15"
4. Click "View Analytics" button on the history entry
5. Verify it switches to Analytics tab and shows the same DOL data

**Pass criteria:**
- History tab shows at least 1 entry with "Houston" and "2023-06-15"
- Entry shows date range (start ~2020-06-15 to end 2023-06-15)
- Clicking "View Analytics" switches to Analytics tab with DOL card showing "2023-06-15"

**Fail if:**
- History is empty (search wasn't saved)
- History entry shows wrong address or date
- "View Analytics" fails to load or shows empty analytics

## Test 5: Admin panel — create and delete user
**Steps:**
1. Click "User Management" tab
2. Verify user table shows at least admin@weatherportal.com with role "admin"
3. Click "Add User" button
4. Fill form: email `testuser@insurance.com`, password `Test@456`, role `user`
5. Click "Create User"
6. Verify new user appears in table with email "testuser@insurance.com" and role "user"
7. Click "Delete" on the new user, confirm the dialog
8. Verify user is removed from table

**Pass criteria:**
- Admin table initially shows admin@weatherportal.com
- After create: "testuser@insurance.com" appears with role "user" badge
- After delete: "testuser@insurance.com" is no longer in the table
- Success messages appear for both create and delete

**Fail if:**
- User Management tab is blank or shows error
- Create user fails or duplicate appears
- Delete doesn't remove the user from the list

## Test 6: Role-based access — user cannot see admin tab
**Steps:**
1. First create a user via admin panel: email `viewer@test.com`, password `View@123`, role `user`
2. Logout (click logout button in navbar)
3. Login as `viewer@test.com` / `View@123`
4. Verify navbar does NOT show "User Management" tab
5. Verify only 3 tabs visible: "Weather Search", "History", "Analytics"

**Pass criteria:**
- After login as regular user: navbar shows exactly 3 tabs, no "User Management"
- User email shows as "viewer@test.com" with role "user" in navbar

**Fail if:**
- "User Management" tab is visible for non-admin user
- Login fails for the new user
- Role shows as "admin" instead of "user"
