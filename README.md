# WeatherShield - Insurance Weather Portal

A full-stack weather intelligence portal for insurance companies. Look up historical weather data and peril events for any US address with a 3-year lookback from any date of loss.

## Features

- **Weather-themed Login** — Animated storm login page with role-based access
- **Address Geocoding & Map** — Enter street address, city, state, ZIP; pin location on interactive map (Leaflet/OpenStreetMap)
- **3-Year Historical Weather** — Uses Open-Meteo Archive API (free, no API key) to fetch daily weather data
- **Peril Detection** — Automatically classifies weather events into insurance perils: Hail, Wind, Thunderstorm, Heavy Rain/Flooding, Winter Storm, Tornado Risk, Ice Storm
- **Date of Loss Highlight** — DOL weather conditions are prominently displayed with peril badges
- **Analytics Dashboard** — Charts for monthly peril events, temperature trends, precipitation & wind, peril distribution pie chart
- **Search History** — All searches saved and viewable with full analytics recall
- **Admin Panel** — Add, edit, and remove portal users with email/password and role management

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS      |
| Charts    | Recharts                          |
| Maps      | Leaflet + OpenStreetMap            |
| Backend   | Node.js, Express                  |
| Database  | SQLite (better-sqlite3)            |
| Auth      | JWT + bcryptjs                     |
| Weather   | Open-Meteo Archive API (free)      |
| Geocoding | Nominatim (OpenStreetMap)          |

## Getting Started

### Prerequisites

- Node.js 18+

### Install

```bash
npm run install:all
```

### Run (Development)

```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173) concurrently.

### Build for Production

```bash
npm run build
npm start
```

The production server serves the built frontend and API on port 3001.

## Deploy to Render (Free)

1. Push this repo to GitHub
2. Go to [render.com/new](https://render.com/new) → **Blueprint** → connect your GitHub repo
3. Render will auto-detect `render.yaml` and create the service
4. Click **Apply** — it will build and deploy automatically
5. Your app will be live at `https://weathershield-xxxx.onrender.com`

**Or deploy manually:**
1. Go to [render.com/new](https://render.com/new) → **Web Service** → connect your repo
2. Set **Build Command**: `npm run install:all && npm run build`
3. Set **Start Command**: `npm start`
4. Set **Environment Variable**: `NODE_ENV` = `production`
5. Click **Create Web Service**

> **Note:** Render's free tier uses ephemeral storage — the SQLite database resets on each deploy. The default admin account auto-recreates on startup. For persistent data, upgrade to a paid plan or switch to PostgreSQL.

## Default Credentials

| Role  | Email                     | Password  |
|-------|---------------------------|-----------|
| Admin | admin@weatherportal.com   | Admin@123 |

The admin account is auto-created on first launch. Admins can create additional user accounts from the User Management tab.

## Peril Classification

Weather events are classified into insurance perils based on WMO weather codes and meteorological thresholds:

| Peril                | Threshold                                          |
|----------------------|----------------------------------------------------|
| Hail                 | WMO code 96 (slight) or 99 (heavy)                |
| Wind                 | Gusts >= 58 mph                                    |
| Thunderstorm         | WMO code 95, 96, 99                               |
| Heavy Rain / Flooding| Precipitation > 2.0 inches/day                    |
| Winter Storm         | WMO snow codes + temperature <= 32°F              |
| Tornado Risk         | Thunderstorm + gusts >= 75 mph                    |
| Ice Storm            | WMO freezing rain/drizzle codes                   |

## API Endpoints

| Method | Path                    | Auth   | Description                        |
|--------|-------------------------|--------|------------------------------------|
| POST   | /api/auth/login         | Public | Login with email/password          |
| GET    | /api/users              | Admin  | List all users                     |
| POST   | /api/users              | Admin  | Create user                        |
| PUT    | /api/users/:id          | Admin  | Update user                        |
| DELETE | /api/users/:id          | Admin  | Delete user                        |
| POST   | /api/weather/search     | User   | Search weather data for location   |
| GET    | /api/weather/history    | User   | Get user's search history          |
| GET    | /api/weather/history/:id| User   | Get specific search with full data |
| DELETE | /api/weather/history/:id| User   | Delete a search record             |
