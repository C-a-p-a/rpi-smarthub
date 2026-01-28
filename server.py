from flask import Flask, jsonify, Response
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# NRK RSS Feed URL
NRK_RSS_URL = "https://www.nrk.no/toppsaker.rss"

# Stock symbols to track
# premarket: True = show pre-market/after-hours price when available
# is_index: True = don't show price, only percentage
# category: for grouping on detail page
STOCK_SYMBOLS = [
    # Indices
    {"symbol": "^IXIC", "name": "NASDAQ", "premarket": False, "is_index": True, "category": "index"},
    {"symbol": "^GSPC", "name": "S&P 500", "premarket": False, "is_index": True, "category": "index"},
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
    {"symbol": "SPY", "name": "S&P 500 ETF", "premarket": True, "is_index": False, "category": "fund"},
    {"symbol": "QQQ", "name": "Nasdaq 100 ETF", "premarket": True, "is_index": False, "category": "fund"},
    {"symbol": "VOO", "name": "Vanguard S&P 500", "premarket": True, "is_index": False, "category": "fund"},
    {"symbol": "VTI", "name": "Vanguard Total", "premarket": True, "is_index": False, "category": "fund"},
    {"symbol": "NLR", "name": "Uranium & Nuclear", "premarket": True, "is_index": False, "category": "fund"},
    {"symbol": "DFNS", "name": "VanEck Defense", "premarket": True, "is_index": False, "category": "fund"},
    {"symbol": "UFO", "name": "VanEck Space", "premarket": True, "is_index": False, "category": "fund"},
]

STOP_ID = "NSR:StopPlace:30918"  # Møhlenpris
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
    try:
        r = requests.get(NRK_RSS_URL, headers={
            "User-Agent": "SmartHub-WH56/1.0"
        })
        r.raise_for_status()
        return Response(r.content, mimetype='application/rss+xml')
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


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
SPORTDB_API_KEY = "L52UCRmPkCwYi9ONoTtRrcjN7gD9Kw3KjAHmnFRk"
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


# Calendar ICS feeds
CALENDAR_FEEDS = [
    "https://p191-caldav.icloud.com/published/2/MTcxNDU1NTcwMzExNzE0NRBxL34ctG9-eFifg7_MeMtcFQpwEsezKo9y4SkmQp_l",
    "https://p191-caldav.icloud.com/published/2/MTcxNDU1NTcwMzExNzE0NRBxL34ctG9-eFifg7_MeMtvHWx7DRNJ15tejm_iPCzU",
    "https://p191-caldav.icloud.com/published/2/MTcxNDU1NTcwMzExNzE0NRBxL34ctG9-eFifg7_MeMv0FJ4ZvTrNIcFqEfKTAu7jcVPba4ym4b23Ho-YqY0cpttPb4rFlpvh85wMhOn9ZjM",
    "https://p191-caldav.icloud.com/published/2/MTcxNDU1NTcwMzExNzE0NRBxL34ctG9-eFifg7_MeMtaZRHwsuiEFJPF0vvRCsmbYOk65qb1HVmxCjJFBGYXB0HRfSslzam-C7313TcaiXo",
    "https://calendars.icloud.com/holidays/no_no.ics",
]


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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
