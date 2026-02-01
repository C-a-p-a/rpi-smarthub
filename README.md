# RPi SmartHub

A smart home dashboard for Raspberry Pi designed as a wall-mounted display. Shows real-time information including weather, public transport, news, stocks, football matches, calendar events, and a collaborative shopping list.

Built for a shared residence in Bergen, Norway (W56).

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

- Raspberry Pi (tested on Pi 4)
- Python 3.7+
- Display (optimized for 1280x720)

### Python Dependencies

```bash
pip install flask flask-cors requests icalendar python-dateutil
```

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/rpi-smarthub.git
   cd rpi-smarthub
   ```

2. Configure API credentials in `server.py`:
   - Telegram Bot Token (line 14)
   - SportDB API Key (line 293)
   - iCloud CalDAV URLs (lines 392-399)

3. Start the servers:
   ```bash
   # Terminal 1: Start Flask API
   python3 server.py

   # Terminal 2: Serve static files
   python3 -m http.server 3000
   ```

4. Open `http://localhost:3000` in a browser

### Raspberry Pi Deployment

Copy files to `/home/pi/dashboard` and use the included startup script:

```bash
./server.sh
```

For auto-start on boot, add to `/etc/rc.local` or create a systemd service.

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
├── server.py           # Flask API backend
├── server.sh           # Startup script for RPi
├── index.html          # Main dashboard
├── app.js              # Core dashboard logic
├── style.css           # Dashboard styles
├── detail-page.js      # Shared detail page logic
├── detail-style.css    # Detail page styles
├── shopping_list.json  # Persistent shopping data
└── [feature].html/js   # Individual widget pages
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
