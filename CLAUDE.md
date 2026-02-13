# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RPi SmartHub is a wall-mounted smart dashboard for Raspberry Pi (1280x720 display) showing real-time weather, bus departures, news, stocks, football matches, calendar events, and a collaborative shopping list. Built for a shared residence in Bergen, Norway (W56).

## Tech Stack

- **Backend:** Python Flask (port 5000) — single file `server/app.py`
- **Frontend:** Vanilla JavaScript, HTML5, CSS3 (served via Python http.server on port 3000)
- **No build step, no bundler, no framework** — direct static file serving

## Running the Application

```bash
# Development (two terminals)
cd server && python3 app.py                    # Flask API on :5000
cd public && python3 -m http.server 3000       # Static files on :3000

# Or use the start script (backgrounds both)
./scripts/start.sh

# Production (Raspberry Pi with systemd)
sudo ./scripts/install-services.sh             # Install 3 services
sudo systemctl status smarthub-api             # Check status
sudo journalctl -u smarthub-api -f             # View logs
```

Install Python dependencies: `pip install -r requirements.txt`

## Architecture

### Backend (`server/app.py`)

Single Flask file acting as API aggregator. All routes are defined at module level — no blueprints. Key patterns:
- External API calls use `requests` with timeouts
- Shopping list persists to `data/shopping_list.json` (file-based, no database)
- Telegram bot runs in a background `threading.Thread` using long-polling
- Environment variables loaded via `python-dotenv` from project root `.env`

API endpoints:
| Endpoint | Source | Notes |
|---|---|---|
| `/departures` | Entur GraphQL API | Bus stop configured via `ENTUR_STOP_ID` |
| `/news/all` | RSS feeds (E24, TV2) | Parses XML, returns combined JSON |
| `/stocks` | Yahoo Finance chart API | Pre/post-market support, stock list hardcoded in `STOCK_SYMBOLS` |
| `/football` | SportDB Flashscore API | PL + CL, today's matches only |
| `/calendar` | iCal/CalDAV feeds | Parses ICS, returns today+tomorrow events |
| `/wifi` | Environment variables | Returns SSID/password for QR code |
| `/temperature` | `/sys/class/thermal/` | RPi CPU temp, returns mock 42°C on non-RPi |
| `/shopping/*` | Local JSON file | CRUD + Telegram bot sync |

### Frontend

**Dashboard page** (`public/index.html`): Grid layout with widgets, news ticker, and stock ticker in footer. Each widget links to a detail page.

**Widget pattern** (`public/js/widgets/*.js`): Each widget is a self-contained JS file loaded via `<script>` tag. Pattern:
1. Define API URL (pointing to `localhost:5000`)
2. `fetch()` data from Flask API (weather is the exception — fetches directly from MET Norway API)
3. Render HTML into a DOM container by ID
4. Set up `setInterval` for periodic updates

Polling intervals: weather 30min, stocks 60s, news 5min, departures 60s, shopping 30s, football 60s, calendar 5min.

**Detail pages** (`public/pages/*.html`): Each includes `detail-page.js` which provides clock, date, and auto-redirect countdown (90 seconds back to main dashboard). Main dashboard has its own 2-minute inactivity redirect (in `app.js`).

### Three-Service Production Setup (systemd)

- `smarthub-api` — Flask API server (port 5000)
- `smarthub-frontend` — Python http.server for static files (port 3000)
- `smarthub-kiosk` — Chromium in kiosk mode pointing to localhost:3000

## Environment Variables

Copy `.env.example` to `.env`. Required for full functionality:
- `TELEGRAM_BOT_TOKEN` — Telegram bot for shopping list sync
- `SPORTDB_API_KEY` — Football match data
- `ENTUR_STOP_ID` — Bus stop ID (default: Møhlenpris `NSR:StopPlace:30918`)
- `CALENDAR_FEEDS` — Comma-separated iCal URLs
- `WIFI_SSID` / `WIFI_PASSWORD` — For QR code page

## Localization

All UI text is in Norwegian (Bokmål). Dates use Norwegian locale with ISO week numbers. Weather descriptions are Norwegian translations of MET Norway symbol codes. Keep all user-facing strings in Norwegian.

## Key Conventions

- Stock symbols and categories are hardcoded in `STOCK_SYMBOLS` list in `server/app.py`
- News sources are hardcoded in `NEWS_FEEDS` list in `server/app.py`
- Weather coordinates are hardcoded in `public/js/widgets/weather.js` (Bergen/Møhlenpris)
- Frontend uses no module system — all widget JS files share global scope
- CSS is split: `main.css` for dashboard, `detail.css` for detail pages
- Skeleton loading placeholders are used in HTML for initial load states
