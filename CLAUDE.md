# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RPi SmartHub is a wall-mounted smart dashboard for Raspberry Pi (1280x720 display) showing real-time weather, bus departures, news, stocks, football matches, calendar events, and a collaborative shopping list. Built for a shared residence in Bergen, Norway.

## Tech Stack

- **Backend:** Python Flask (port 5000)
- **Frontend:** Vanilla JavaScript, HTML5, CSS3 (served via Python http.server on port 3000)
- **No build step required** - direct static file serving

## Running the Application

```bash
# Start Flask API server
python3 server.py

# In another terminal, serve static files
python3 -m http.server 3000

# Access at http://localhost:3000
```

On Raspberry Pi, use `./server.sh` from `/home/pi/dashboard`.

## Architecture

### Backend (`server.py`)
Single Flask app acting as API aggregator for external services:
- `/departures` - Entur API (Bergen public transport)
- `/weather` - MET Norway API
- `/news/all` - RSS feed aggregator (E24, TV2)
- `/stocks` - Yahoo Finance (with pre/post-market support)
- `/football` - SportDB API (Premier League, Champions League)
- `/calendar` - iCloud CalDAV parser (5 calendar feeds)
- `/shopping/*` - Local JSON-based shopping list with Telegram bot sync

Background thread runs Telegram bot for shopping list management via commands (`/add`, `/list`, `/done`, `/remove`, `/clear`).

### Frontend Structure
- **Main dashboard:** `index.html` + `app.js` + `style.css`
- **Widget controllers:** Each feature has its own JS file (e.g., `weather.js`, `stocks.js`, `busstider.js`)
- **Detail pages:** Clicking widgets opens dedicated pages (e.g., `weather.html`, `stocks.html`)
- **Shared detail logic:** `detail-page.js` + `detail-style.css` handle countdown timer and auto-return

### Auto-Navigation
- Main dashboard: Returns after 2 minutes of inactivity
- Detail pages: Auto-return to main after 90 seconds (countdown visible)

### Data Flow
- Widgets poll Flask API at intervals (stocks: 60s, news: 5min, shopping: 30s)
- Shopping list persists to `shopping_list.json` and syncs via Telegram bot
- All other data is fetched on-demand (no server-side caching)

## Key Files

| File | Purpose |
|------|---------|
| `server.py` | All API routes and Telegram bot |
| `index.html` | Main dashboard layout (4-column grid) |
| `app.js` | Clock, Norwegian date formatting, inactivity timer |
| `detail-page.js` | Shared countdown/return logic for detail pages |
| `shopping_list.json` | Persistent shopping list data |

## Localization

All UI text, dates, and content are in Norwegian. Date formatting uses Norwegian locale with ISO week numbers.

## Environment Variables

Configuration is stored in `.env` (copy from `.env.example`):
- `TELEGRAM_BOT_TOKEN` - Telegram bot for shopping list
- `SPORTDB_API_KEY` - Football match data
- `ENTUR_STOP_ID` - Bus stop ID for departures
- `CALENDAR_FEEDS` - Comma-separated iCal URLs

## External Dependencies

CDN resources:
- Yr Weather Symbols (SVG icons) from cdn.jsdelivr.net
- Google Fonts (Inter)

Python packages (not in requirements.txt):
- flask, flask-cors, requests, icalendar, python-dateutil, python-dotenv
