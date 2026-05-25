---
name: testing-weathershield
description: Test the WeatherShield Insurance Weather Portal end-to-end. Use when verifying weather search, analytics, admin, or auth changes.
---

# Testing WeatherShield Portal

## Prerequisites
- Node.js 18+ installed
- Dependencies installed: `npm run install:all` from repo root

## Devin Secrets Needed
- None — Open-Meteo API is free (no key), Nominatim geocoding is free

## Starting the Dev Server
```bash
cd /home/ubuntu/repos/insurance-weather
npm run dev
```
This starts both backend (port 3001) and frontend (port 5173) via concurrently.

Verify both are running:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"admin@weatherportal.com","password":"Admin@123"}'
# Should return 200

curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/
# Should return 200
```

## Default Credentials
- Admin: `admin@weatherportal.com` / `Admin@123`
- The admin user is auto-created on first DB initialization

## Test Flow (Primary Path)

### 1. Login
- Navigate to http://localhost:5173/ → redirects to /login
- Enter admin credentials → redirects to dashboard
- Verify 4 tabs visible: Weather Search, History, Analytics, User Management
- Verify navbar shows email and "admin" role

### 2. Weather Search + Geocoding
- Fill City (e.g., "Houston"), select State (e.g., "TX")
- Click "Locate on Map" → map zooms to location, coordinates appear (~29.75, -95.36 for Houston)
- Set Date of Loss (e.g., 2023-06-15)
- Click "Search Weather & Peril Data" → auto-switches to Analytics tab

### 3. Analytics Dashboard
- DOL card shows the date with weather details (temperature, precipitation, wind)
- "Total Days Analyzed" should be ~1096 for a 3-year lookback
- 4 charts render: Monthly Peril Events, Peril Distribution pie, Temperature Trends, Precipitation & Wind
- "All Peril Events" section with filter dropdown
- Note: DOL date might not have perils — this is normal. Check that the 3-year window has peril data.

### 4. Search History
- Click "History" tab → shows previous search with address, DOL, date range
- Click "View Analytics" → reloads analytics dashboard with same data

### 5. Admin Panel (admin only)
- Click "User Management" tab
- "Add User" → fill email/password/role → "Create User" → user appears in table
- Edit/Delete buttons work

### 6. Role-Based Access
- Create a user with role "user" via admin panel
- Logout, login as that user
- Verify only 3 tabs visible (no "User Management")

## Tips & Gotchas
- The state dropdown requires selecting a state before "Locate on Map" becomes enabled
- The "Search Weather & Peril Data" button requires both coordinates (from geocoding) AND a date of loss
- The date input uses mm/dd/yyyy format in the browser
- Open-Meteo Archive API might be slow for some date ranges; allow 5-10s for the search to complete
- The SQLite database file (weather_portal.db) is in server/ and is gitignored; it auto-creates on first run
- If the DB gets corrupted, delete `server/weather_portal.db` and restart the server
- The Nominatim geocoding API has rate limits — if geocoding fails, wait a moment and retry
- Peril detection depends on actual historical weather data; some locations/periods may have few or no perils
