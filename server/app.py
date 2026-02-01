from flask import Flask, jsonify, Response, request
from flask_cors import CORS
import requests
import json
import os
import threading
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Get the project root directory (parent of server/)
PROJECT_ROOT = Path(__file__).parent.parent

# Load environment variables from .env file in project root
load_dotenv(PROJECT_ROOT / ".env")

app = Flask(__name__)
CORS(app)

# ===== SHOPPING LIST =====
SHOPPING_LIST_FILE = PROJECT_ROOT / "data" / "shopping_list.json"
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

def load_shopping_list():
    """Load shopping list from file"""
    if os.path.exists(SHOPPING_LIST_FILE):
        with open(SHOPPING_LIST_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"items": [], "last_updated": None}

def save_shopping_list(data):
    """Save shopping list to file"""
    data["last_updated"] = datetime.now().isoformat()
    with open(SHOPPING_LIST_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def add_item(item_text, added_by="SmartHub"):
    """Add item to shopping list"""
    data = load_shopping_list()
    item = {
        "id": len(data["items"]) + 1,
        "text": item_text.strip(),
        "added_by": added_by,
        "added_at": datetime.now().isoformat(),
        "checked": False
    }
    data["items"].append(item)
    save_shopping_list(data)
    return item

def remove_item(item_text):
    """Remove item from shopping list by text"""
    data = load_shopping_list()
    item_text_lower = item_text.strip().lower()
    removed = False
    data["items"] = [i for i in data["items"] if i["text"].lower() != item_text_lower or (removed := True) and False]
    # Simple removal - find and remove first match
    new_items = []
    found = False
    for i in data["items"]:
        if not found and i["text"].lower() == item_text_lower:
            found = True
            removed = True
        else:
            new_items.append(i)
    data["items"] = new_items
    save_shopping_list(data)
    return removed

def toggle_item(item_id):
    """Toggle item checked status"""
    data = load_shopping_list()
    for item in data["items"]:
        if item["id"] == item_id:
            item["checked"] = not item["checked"]
            save_shopping_list(data)
            return item
    return None

def clear_checked():
    """Remove all checked items"""
    data = load_shopping_list()
    data["items"] = [i for i in data["items"] if not i["checked"]]
    save_shopping_list(data)

def clear_all():
    """Clear entire shopping list"""
    save_shopping_list({"items": [], "last_updated": None})

# RSS Feed URLs
NEWS_FEEDS = [
    {"name": "E24", "url": "https://e24.no/rss2/", "color": "#FF6D00"},
    {"name": "TV2 Nyheter", "url": "https://www.tv2.no/rss/nyheter", "color": "#E53935"},
    {"name": "TV2 Sport", "url": "https://www.tv2.no/rss/sport", "color": "#43A047"},
    {"name": "TV2 Underholdning", "url": "https://www.tv2.no/rss/underholdning", "color": "#AB47BC"},
]

# Stock symbols to track
# premarket: True = show pre-market/after-hours price when available
# is_index: True = don't show price, only percentage
# category: for grouping on detail page
STOCK_SYMBOLS = [
    # Indices
    {"symbol": "^IXIC", "name": "NASDAQ", "premarket": False, "is_index": True, "category": "index"},
    # My stocks
    {"symbol": "ONDS", "name": "ONDS", "premarket": True, "is_index": False, "category": "mine"},
    {"symbol": "IREN", "name": "IREN", "premarket": True, "is_index": False, "category": "mine"},
    {"symbol": "OSS", "name": "OSS", "premarket": True, "is_index": False, "category": "mine"},
    {"symbol": "PNG.V", "name": "PNG", "premarket": False, "is_index": False, "category": "mine"},
    # Magnificent 7
    {"symbol": "AAPL", "name": "Apple", "premarket": True, "is_index": False, "category": "mag7"},
    {"symbol": "MSFT", "name": "Microsoft", "premarket": True, "is_index": False, "category": "mag7"},
    {"symbol": "GOOGL", "name": "Google", "premarket": True, "is_index": False, "category": "mag7"},
    {"symbol": "AMZN", "name": "Amazon", "premarket": True, "is_index": False, "category": "mag7"},
    {"symbol": "NVDA", "name": "Nvidia", "premarket": True, "is_index": False, "category": "mag7"},
    {"symbol": "META", "name": "Meta", "premarket": True, "is_index": False, "category": "mag7"},
    {"symbol": "TSLA", "name": "Tesla", "premarket": True, "is_index": False, "category": "mag7"},
    # ETFs / Funds
    {"symbol": "QQQ", "name": "Nasdaq 100 ETF", "premarket": True, "is_index": False, "category": "fund"},
    {"symbol": "NLR", "name": "Uranium & Nuclear", "premarket": True, "is_index": False, "category": "fund"},
    {"symbol": "DFNS", "name": "VanEck Defense", "premarket": True, "is_index": False, "category": "fund"},
    {"symbol": "UFO", "name": "VanEck Space", "premarket": True, "is_index": False, "category": "fund"},
]

STOP_ID = os.getenv("ENTUR_STOP_ID", "NSR:StopPlace:30918")  # Møhlenpris
ENTUR_URL = "https://api.entur.io/journey-planner/v3/graphql"

QUERY = """
{
  stopPlace(id: "%s") {
    name
    estimatedCalls(numberOfDepartures: 30) {
      expectedDepartureTime
      aimedDepartureTime
      destinationDisplay {
        frontText
      }
      serviceJourney {
        line {
          publicCode
          transportMode
        }
      }
    }
  }
}
""" % STOP_ID


@app.route('/departures')
def departures():
    headers = {
        "ET-Client-Name": "smarthub-wh56",
        "Content-Type": "application/json"
    }
    try:
        r = requests.post(ENTUR_URL, json={"query": QUERY}, headers=headers)
        r.raise_for_status()
        return jsonify(r.json())
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


@app.route('/news')
def news():
    """Return list of available news feeds"""
    return jsonify(NEWS_FEEDS)

@app.route('/news/<int:feed_index>')
def news_feed(feed_index):
    """Return specific RSS feed by index"""
    try:
        if feed_index < 0 or feed_index >= len(NEWS_FEEDS):
            return jsonify({"error": "Invalid feed index"}), 400
        
        feed = NEWS_FEEDS[feed_index]
        r = requests.get(feed["url"], headers={
            "User-Agent": "SmartHub-WH56/1.0"
        }, timeout=10)
        r.raise_for_status()
        return Response(r.content, mimetype='application/rss+xml')
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/news/all')
def news_all():
    """Return all news feeds combined as JSON"""
    import xml.etree.ElementTree as ET
    from datetime import datetime
    
    all_items = []
    
    for i, feed in enumerate(NEWS_FEEDS):
        try:
            r = requests.get(feed["url"], headers={
                "User-Agent": "SmartHub-WH56/1.0"
            }, timeout=10)
            r.raise_for_status()
            
            root = ET.fromstring(r.content)
            items = root.findall('.//item')
            
            for item in items[:5]:  # Max 5 per source
                title = item.find('title')
                link = item.find('link')
                description = item.find('description')
                pubDate = item.find('pubDate')
                
                all_items.append({
                    "title": title.text if title is not None else "",
                    "link": link.text if link is not None else "",
                    "description": description.text if description is not None else "",
                    "pubDate": pubDate.text if pubDate is not None else "",
                    "source": feed["name"],
                    "sourceColor": feed["color"],
                    "sourceIndex": i
                })
        except Exception as e:
            print(f"Error fetching {feed['name']}: {e}")
            continue
    
    # Sort by date (newest first)
    def parse_date(item):
        try:
            from email.utils import parsedate_to_datetime
            return parsedate_to_datetime(item["pubDate"])
        except:
            return datetime.min
    
    all_items.sort(key=parse_date, reverse=True)
    
    return jsonify(all_items)


@app.route('/stocks')
def stocks():
    """Fetch stock data from Yahoo Finance chart API with pre/post market support"""
    results = []
    
    for stock in STOCK_SYMBOLS:
        symbol = stock["symbol"]
        name = stock["name"]
        is_index = stock.get("is_index", False)
        show_extended = stock.get("premarket", False)
        
        try:
            # Yahoo Finance chart API with extended hours
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1m&range=1d&includePrePost=true"
            headers = {"User-Agent": "Mozilla/5.0"}
            r = requests.get(url, headers=headers, timeout=5)
            
            if r.status_code == 200:
                data = r.json()
                result = data.get("chart", {}).get("result", [{}])[0]
                meta = result.get("meta", {})
                
                regular_price = meta.get("regularMarketPrice", 0)
                prev_close = meta.get("previousClose", regular_price)
                
                # Check for pre/post market price
                premarket_price = meta.get("preMarketPrice")
                postmarket_price = meta.get("postMarketPrice")
                
                # Determine which price to use
                price = regular_price
                session_type = None
                
                if show_extended:
                    # Pre-market takes priority if available
                    if premarket_price and premarket_price > 0:
                        price = premarket_price
                        session_type = "PM"
                    # Then check post-market
                    elif postmarket_price and postmarket_price > 0:
                        price = postmarket_price
                        session_type = "AH"
                
                # Calculate change from previous close
                if prev_close and prev_close > 0:
                    change_pct = ((price - prev_close) / prev_close) * 100
                else:
                    change_pct = 0
                
                results.append({
                    "symbol": name,
                    "price": round(price, 2),
                    "change": round(change_pct, 2),
                    "currency": meta.get("currency", "USD"),
                    "is_index": is_index,
                    "session": session_type,
                    "category": stock.get("category", "other")
                })
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
    
    return jsonify(results)


# SportDB Flashscore API
SPORTDB_API_KEY = os.getenv("SPORTDB_API_KEY", "")
SPORTDB_BASE_URL = "https://api.sportdb.dev/api/flashscore"

# League endpoints
LEAGUES = {
    "PL": "/football/england:198/premier-league:dYlOSQOD",
    "CL": "/football/europe:6/champions-league:xGrwqq16"
}


@app.route('/football')
def football():
    """Fetch football data - PL and CL matches TODAY only using SportDB API"""
    from datetime import datetime, timezone
    
    headers = {"X-API-Key": SPORTDB_API_KEY}
    now = datetime.now(timezone.utc)
    today = now.date()
    today_str = today.isoformat()
    
    # Use dict with event_id as key to avoid duplicates
    matches_dict = {}
    
    # Determine current season (July starts new season)
    if now.month >= 7:
        season = f"{now.year}-{now.year + 1}"
    else:
        season = f"{now.year - 1}-{now.year}"
    
    for comp, league_path in LEAGUES.items():
        try:
            # Get scheduled fixtures for today
            fixtures_url = f"{SPORTDB_BASE_URL}{league_path}/{season}/fixtures?page=1"
            r = requests.get(fixtures_url, headers=headers, timeout=10)
            
            if r.status_code == 200 and r.text and r.text != "null":
                fixtures = r.json()
                if fixtures:
                    for match in fixtures:
                        match_date = match.get("startDateTimeUtc", "")
                        if match_date and match_date.startswith(today_str):
                            event_id = match.get("eventId")
                            status = match.get("eventStage", "SCHEDULED")
                            matches_dict[event_id] = {
                                "competition": comp,
                                "home": match.get("home3CharName", "???"),
                                "away": match.get("away3CharName", "???"),
                                "home_score": int(match.get("homeScore", 0)) if match.get("homeScore") else None,
                                "away_score": int(match.get("awayScore", 0)) if match.get("awayScore") else None,
                                "kickoff": match_date,
                                "started": status in ["LIVE", "FINISHED", "1ST_HALF", "2ND_HALF", "HALFTIME"],
                                "finished": status == "FINISHED",
                                "minute": match.get("gameTime") if match.get("gameTime") and match.get("gameTime") != "-1" else None
                            }
            
            # Check results for today (finished matches)
            results_url = f"{SPORTDB_BASE_URL}{league_path}/{season}/results?page=1"
            r = requests.get(results_url, headers=headers, timeout=10)
            
            if r.status_code == 200 and r.text and r.text != "null":
                results = r.json()
                if results:
                    for match in results:
                        match_date = match.get("startDateTimeUtc", "")
                        if match_date and match_date.startswith(today_str):
                            event_id = match.get("eventId")
                            # Only add if not already in fixtures, or update with final score
                            matches_dict[event_id] = {
                                "competition": comp,
                                "home": match.get("home3CharName", "???"),
                                "away": match.get("away3CharName", "???"),
                                "home_score": int(match.get("homeScore", 0)) if match.get("homeScore") else 0,
                                "away_score": int(match.get("awayScore", 0)) if match.get("awayScore") else 0,
                                "kickoff": match_date,
                                "started": True,
                                "finished": True,
                                "minute": None
                            }
                                
        except Exception as e:
            print(f"Error fetching {comp} data: {e}")
    
    # Convert to list and sort by kickoff time
    all_fixtures = list(matches_dict.values())
    all_fixtures.sort(key=lambda x: x.get("kickoff", ""))
    
    # Only show widget if there are matches today
    show_widget = len(all_fixtures) > 0
    
    print(f"Football API: {len(all_fixtures)} fixtures today, show={show_widget}")
    
    return jsonify({
        "show": show_widget,
        "deadline": None,
        "fixtures": all_fixtures
    })


# Calendar ICS feeds (loaded from environment variable, comma-separated)
CALENDAR_FEEDS = [url.strip() for url in os.getenv("CALENDAR_FEEDS", "").split(",") if url.strip()]


@app.route('/calendar')
def calendar():
    """Fetch calendar events from multiple ICS feeds"""
    from datetime import datetime, timezone, timedelta
    from icalendar import Calendar
    from dateutil import rrule
    from dateutil.tz import gettz, UTC
    
    now = datetime.now(timezone.utc)
    today = now.date()
    tomorrow = today + timedelta(days=1)
    
    all_events = []
    local_tz = gettz("Europe/Oslo")
    
    for feed_url in CALENDAR_FEEDS:
        try:
            r = requests.get(feed_url, timeout=10)
            if r.status_code != 200:
                continue
                
            cal = Calendar.from_ical(r.content)
            
            for component in cal.walk():
                if component.name != "VEVENT":
                    continue
                
                summary = str(component.get('summary', 'Ingen tittel'))
                dtstart = component.get('dtstart')
                dtend = component.get('dtend')
                
                if not dtstart:
                    continue
                
                start = dtstart.dt
                
                # Handle all-day events (date without time)
                is_all_day = not isinstance(start, datetime)
                
                if is_all_day:
                    # All-day event
                    if start == today or start == tomorrow:
                        all_events.append({
                            "summary": summary,
                            "start": start.isoformat(),
                            "end": dtend.dt.isoformat() if dtend else None,
                            "all_day": True,
                            "is_today": start == today,
                            "is_tomorrow": start == tomorrow
                        })
                else:
                    # Timed event - convert to local timezone
                    if start.tzinfo is None:
                        start = start.replace(tzinfo=UTC)
                    
                    start_local = start.astimezone(local_tz)
                    event_date = start_local.date()
                    
                    if event_date == today or event_date == tomorrow:
                        end_str = None
                        if dtend:
                            end = dtend.dt
                            if end.tzinfo is None:
                                end = end.replace(tzinfo=UTC)
                            end_local = end.astimezone(local_tz)
                            end_str = end_local.strftime("%H:%M")
                        
                        all_events.append({
                            "summary": summary,
                            "start": start_local.isoformat(),
                            "time": start_local.strftime("%H:%M"),
                            "end_time": end_str,
                            "all_day": False,
                            "is_today": event_date == today,
                            "is_tomorrow": event_date == tomorrow
                        })
                        
        except Exception as e:
            print(f"Error fetching calendar {feed_url}: {e}")
    
    # Sort events: today first, then by time
    all_events.sort(key=lambda x: (
        not x.get("is_today"),  # Today first
        x.get("all_day"),  # Timed events before all-day
        x.get("time", "99:99") if not x.get("all_day") else "00:00"
    ))
    
    # Split into today and tomorrow
    today_events = [e for e in all_events if e.get("is_today")]
    tomorrow_events = [e for e in all_events if e.get("is_tomorrow")]
    
    return jsonify({
        "today": today_events,
        "tomorrow": tomorrow_events
    })


# ===== SHOPPING LIST ENDPOINTS =====

@app.route('/shopping')
def get_shopping_list():
    """Get current shopping list"""
    return jsonify(load_shopping_list())

@app.route('/shopping/add', methods=['POST'])
def api_add_item():
    """Add item via API"""
    data = request.json
    if data and data.get("item"):
        item = add_item(data["item"], data.get("added_by", "SmartHub"))
        return jsonify({"success": True, "item": item})
    return jsonify({"success": False, "error": "No item provided"}), 400

@app.route('/shopping/toggle/<int:item_id>', methods=['POST'])
def api_toggle_item(item_id):
    """Toggle item checked status"""
    item = toggle_item(item_id)
    if item:
        return jsonify({"success": True, "item": item})
    return jsonify({"success": False, "error": "Item not found"}), 404

@app.route('/shopping/remove', methods=['POST'])
def api_remove_item():
    """Remove item by text"""
    data = request.json
    if data and data.get("item"):
        removed = remove_item(data["item"])
        return jsonify({"success": removed})
    return jsonify({"success": False, "error": "No item provided"}), 400

@app.route('/shopping/clear', methods=['POST'])
def api_clear_list():
    """Clear checked items or all items"""
    data = request.json or {}
    if data.get("all"):
        clear_all()
    else:
        clear_checked()
    return jsonify({"success": True})


# ===== TELEGRAM BOT =====

def send_telegram_message(chat_id, text):
    """Send message via Telegram bot"""
    url = f"{TELEGRAM_API_URL}/sendMessage"
    requests.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"})

def format_list_message():
    """Format shopping list for Telegram"""
    data = load_shopping_list()
    if not data["items"]:
        return "🛒 <b>Handlelisten er tom!</b>\n\nBruk /add [vare] for å legge til."
    
    unchecked = [i for i in data["items"] if not i["checked"]]
    checked = [i for i in data["items"] if i["checked"]]
    
    msg = "🛒 <b>Handleliste W56</b>\n\n"
    
    if unchecked:
        for item in unchecked:
            msg += f"• {item['text']}\n"
    
    if checked:
        msg += "\n<s>Ferdig:</s>\n"
        for item in checked:
            msg += f"<s>• {item['text']}</s>\n"
    
    msg += f"\n<i>Sist oppdatert: {data.get('last_updated', 'ukjent')[:16] if data.get('last_updated') else 'aldri'}</i>"
    return msg

def handle_telegram_message(message):
    """Process incoming Telegram message"""
    chat_id = message["chat"]["id"]
    text = message.get("text", "").strip()
    user = message.get("from", {}).get("first_name", "Ukjent")
    
    if not text:
        return
    
    # Commands
    if text.lower() == "/start":
        send_telegram_message(chat_id, 
            "👋 Hei!\n\n"
            "<b>Her er noen nyttige kommandoer:</b>\n"
            "[vare] - Legg til vare\n"
            "/list - Se handlelisten\n"
            "/done [vare] - Merk som ferdig\n"
            "/remove [vare] - Fjern vare\n"
            "/clear - Fjern ferdige varer\n"
            "/clearall - Tøm hele listen"
        )
    
    elif text.lower() == "/list":
        send_telegram_message(chat_id, format_list_message())
    
    elif text.lower().startswith("/add "):
        item_text = text[5:].strip()
        if item_text:
            add_item(item_text, user)
            send_telegram_message(chat_id, f"✅ Lagt til: <b>{item_text}</b>")
        else:
            send_telegram_message(chat_id, "❌ Bruk: /add [vare]")
    
    elif text.lower().startswith("/done "):
        item_text = text[6:].strip()
        data = load_shopping_list()
        found = False
        for item in data["items"]:
            if item["text"].lower() == item_text.lower():
                item["checked"] = True
                found = True
                break
        if found:
            save_shopping_list(data)
            send_telegram_message(chat_id, f"✅ Markert som ferdig: <s>{item_text}</s>")
        else:
            send_telegram_message(chat_id, f"❌ Fant ikke: {item_text}")
    
    elif text.lower().startswith("/remove "):
        item_text = text[8:].strip()
        if remove_item(item_text):
            send_telegram_message(chat_id, f"🗑️ Fjernet: {item_text}")
        else:
            send_telegram_message(chat_id, f"❌ Fant ikke: {item_text}")
    
    elif text.lower() == "/clear":
        clear_checked()
        send_telegram_message(chat_id, "🧹 Fjernet alle ferdige varer!")
    
    elif text.lower() == "/clearall":
        clear_all()
        send_telegram_message(chat_id, "🗑️ Handlelisten er nå tom!")
    
    else:
        # If it's just text without command, treat as adding item
        if not text.startswith("/"):
            add_item(text, user)
            send_telegram_message(chat_id, f"✅ Lagt til: <b>{text}</b>")

def telegram_polling():
    """Poll Telegram for updates"""
    last_update_id = 0
    print("🤖 Telegram bot started!")
    
    while True:
        try:
            url = f"{TELEGRAM_API_URL}/getUpdates?offset={last_update_id + 1}&timeout=30"
            r = requests.get(url, timeout=35)
            
            if r.status_code == 200:
                updates = r.json().get("result", [])
                for update in updates:
                    last_update_id = update["update_id"]
                    if "message" in update:
                        handle_telegram_message(update["message"])
        except Exception as e:
            print(f"Telegram polling error: {e}")
        
        import time
        time.sleep(1)


if __name__ == "__main__":
    # Start Telegram bot in background thread
    telegram_thread = threading.Thread(target=telegram_polling, daemon=True)
    telegram_thread.start()
    
    app.run(host="0.0.0.0", port=5000)
