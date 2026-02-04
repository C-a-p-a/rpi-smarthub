# RPi SmartHub

A smart home dashboard for Raspberry Pi designed as a wall-mounted display. Shows real-time information including weather, public transport, news, stocks, football matches, calendar events, and a collaborative shopping list.


## Features

- **Weather** - Current conditions and forecast from MET Norway (Yr.no)
- **Bus Departures** - Real-time public transport times via Entur API
- **News** - Aggregated headlines from E24 and TV2
- **Stocks** - Live prices with pre/post-market data from Yahoo Finance
- **Football** - Premier League and Champions League matches from SportDB
- **Calendar** - Events synced from iCloud CalDAV
- **Shopping List** - Collaborative list with Telegram bot integration
- **WiFi** - QR code for easy guest network access

## Requirements

- Raspberry Pi (tested on Pi 5)
- Python 3.7+
- Display (optimized for 1280x720)

### Python Dependencies

```bash
pip install -r requirements.txt
```

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/rpi-smarthub.git
   cd rpi-smarthub
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your credentials:
   - `TELEGRAM_BOT_TOKEN` - Your Telegram bot token from @BotFather
   - `SPORTDB_API_KEY` - SportDB API key
   - `ENTUR_STOP_ID` - Bus stop ID (find at https://stoppested.entur.org)
   - `CALENDAR_FEEDS` - Comma-separated iCal/CalDAV URLs
   - `WIFI_SSID` - WiFi network name (for QR code page)
   - `WIFI_PASSWORD` - WiFi password (for QR code page)

4. Start the servers:
   ```bash
   # Option 1: Use the start script
   ./scripts/start.sh

   # Option 2: Manual start
   # Terminal 1: Start Flask API
   cd server && python3 app.py

   # Terminal 2: Serve static files
   cd public && python3 -m http.server 3000
   ```

5. Open `http://localhost:3000` in a browser

### Raspberry Pi Deployment

Use the included startup script:

```bash
./scripts/start.sh
```

For auto-start on boot, create a systemd service.

## Telegram Bot Commands

The shopping list can be managed via Telegram:

| Command | Description |
|---------|-------------|
| `/add <item>` | Add item to shopping list |
| `/list` | Show current shopping list |
| `/done <number>` | Mark item as done |
| `/remove <number>` | Remove item from list |
| `/clear` | Clear completed items |

## Project Structure

```
├── server/
│   └── app.py              # Flask API backend
├── public/
│   ├── index.html          # Main dashboard
│   ├── pages/              # Detail pages (weather, bus, etc.)
│   ├── css/
│   │   ├── main.css        # Dashboard styles
│   │   └── detail.css      # Detail page styles
│   └── js/
│       ├── app.js          # Core dashboard logic
│       ├── detail-page.js  # Shared detail page logic
│       └── widgets/        # Widget controllers
├── data/
│   └── shopping_list.json  # Persistent shopping data
├── scripts/
│   └── start.sh            # Startup script
├── .env.example            # Environment variables template
├── requirements.txt        # Python dependencies
└── README.md
```

## Configuration

The dashboard is configured for Bergen, Norway with:
- Norwegian language and date formats
- Bergen bus stops (Strømgaten, Festplassen)
- Europe/Oslo timezone
- Norwegian news sources

To adapt for another location, modify the API calls in `server.py` and update the locale settings in the JavaScript files.

## Auto-Navigation

The dashboard automatically returns to the main screen:
- After 2 minutes of inactivity on the main page
- After 90 seconds on any detail page

This ensures the display always shows the dashboard overview when not actively being used.

## License

MIT
