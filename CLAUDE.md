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
# Option 1: Use the start script (recommended)
./scripts/start.sh

# Option 2: Manual start
cd server && python3 app.py          # Terminal 1: Flask API
cd public && python3 -m http.server 3000  # Terminal 2: Static files

# Access at http://localhost:3000
```

## Project Structure

```
├── server/
│   └── app.py              # Flask API backend
├── public/
│   ├── index.html          # Main dashboard
│   ├── pages/              # Detail pages
│   ├── css/
│   │   ├── main.css        # Dashboard styles
│   │   └── detail.css      # Detail page styles
│   └── js/
│       ├── app.js          # Core logic
│       ├── detail-page.js  # Shared detail page logic
│       └── widgets/        # Widget controllers
├── data/
│   └── shopping_list.json  # Persistent data
├── scripts/
│   └── start.sh            # Startup script
└── requirements.txt        # Python dependencies
```

## Architecture

### Backend (`server/app.py`)
Single Flask app acting as API aggregator for external services:
- `/departures` - Entur API (Bergen public transport)
- `/news/all` - RSS feed aggregator (E24, TV2)
- `/stocks` - Yahoo Finance (with pre/post-market support)
- `/football` - SportDB API (Premier League, Champions League)
- `/calendar` - iCloud CalDAV parser
- `/shopping/*` - Local JSON-based shopping list with Telegram bot sync

Background thread runs Telegram bot for shopping list management.

### Frontend Structure
- **Main dashboard:** `public/index.html` + `js/app.js` + `css/main.css`
- **Widget controllers:** `public/js/widgets/` (weather.js, stocks.js, bus.js, etc.)
- **Detail pages:** `public/pages/` with shared logic in `js/detail-page.js`

### Auto-Navigation
- Main dashboard: Returns after 2 minutes of inactivity
- Detail pages: Auto-return to main after 90 seconds

### Data Flow
- Widgets poll Flask API at intervals (stocks: 60s, news: 5min, shopping: 30s)
- Shopping list persists to `data/shopping_list.json` and syncs via Telegram bot

## Environment Variables

Configuration stored in `.env` (copy from `.env.example`):
- `TELEGRAM_BOT_TOKEN` - Telegram bot for shopping list
- `SPORTDB_API_KEY` - Football match data
- `ENTUR_STOP_ID` - Bus stop ID for departures
- `CALENDAR_FEEDS` - Comma-separated iCal URLs

## Localization

All UI text, dates, and content are in Norwegian. Date formatting uses Norwegian locale with ISO week numbers.

## External Dependencies

CDN resources:
- Yr Weather Symbols (SVG icons) from cdn.jsdelivr.net
- Google Fonts (Inter)

Python packages: See `requirements.txt`
