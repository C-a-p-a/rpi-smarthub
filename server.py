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
STOCK_SYMBOLS = [
    {"symbol": "^IXIC", "name": "NASDAQ", "premarket": False, "is_index": True},
    {"symbol": "ONDS", "name": "ONDS", "premarket": True, "is_index": False},
    {"symbol": "IREN", "name": "IREN", "premarket": True, "is_index": False},
    {"symbol": "OSS", "name": "OSS", "premarket": True, "is_index": False},
    {"symbol": "PNG.V", "name": "PNG", "premarket": False, "is_index": False},  # TSX Venture (Canada)
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
                    "session": session_type
                })
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
    
    return jsonify(results)


@app.route('/football')
def football():
    """Fetch football data - PL and CL matches TODAY only"""
    from datetime import datetime, timezone
    
    headers = {"User-Agent": "Mozilla/5.0"}
    now = datetime.now(timezone.utc)
    today = now.date()
    
    all_fixtures = []
    deadline_info = None
    
    # === PREMIER LEAGUE (from FPL API) ===
    try:
        # Get bootstrap for deadline and teams
        bootstrap_url = "https://fantasy.premierleague.com/api/bootstrap-static/"
        r = requests.get(bootstrap_url, headers=headers, timeout=10)
        
        if r.status_code == 200:
            data = r.json()
            teams = {t["id"]: t["short_name"] for t in data.get("teams", [])}
            
            # Check FPL deadline
            for event in data.get("events", []):
                if event.get("is_next") and event.get("deadline_time"):
                    deadline_dt = datetime.fromisoformat(event["deadline_time"].replace("Z", "+00:00"))
                    if deadline_dt.date() == today:
                        deadline_info = {
                            "time": event["deadline_time"],
                            "name": f"GW{event.get('id')}"
                        }
                    break
            
            # Get PL fixtures
            fixtures_url = "https://fantasy.premierleague.com/api/fixtures/"
            r2 = requests.get(fixtures_url, headers=headers, timeout=10)
            if r2.status_code == 200:
                for fix in r2.json():
                    if fix.get("kickoff_time"):
                        kickoff = datetime.fromisoformat(fix["kickoff_time"].replace("Z", "+00:00"))
                        if kickoff.date() == today:
                            all_fixtures.append({
                                "competition": "PL",
                                "home": teams.get(fix["team_h"], "???"),
                                "away": teams.get(fix["team_a"], "???"),
                                "home_score": fix.get("team_h_score"),
                                "away_score": fix.get("team_a_score"),
                                "kickoff": fix["kickoff_time"],
                                "started": fix.get("started", False),
                                "finished": fix.get("finished", False)
                            })
    except Exception as e:
        print(f"Error fetching PL data: {e}")
    
    # === CHAMPIONS LEAGUE (from FotMob API) ===
    try:
        # FotMob API - get all matches for today
        date_str = today.strftime("%Y%m%d")
        fotmob_url = f"https://www.fotmob.com/api/matches?date={date_str}"
        
        r = requests.get(fotmob_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.fotmob.com/",
            "Origin": "https://www.fotmob.com"
        }, timeout=10)
        print(f"FotMob response: {r.status_code}")
        
        if r.status_code == 200:
            data = r.json()
            leagues = data.get("leagues", [])
            
            # Find Champions League (league ID 42)
            for league in leagues:
                league_id = league.get("id")
                league_name = league.get("name", "")
                
                # 42 = Champions League, 47 = Premier League (backup if FPL fails)
                if league_id == 42:  # Champions League
                    print(f"Found CL with {len(league.get('matches', []))} matches")
                    
                    for match in league.get("matches", []):
                        home_team = match.get("home", {})
                        away_team = match.get("away", {})
                        status = match.get("status", {})
                        
                        # Build kickoff time
                        utc_time = status.get("utcTime", "")
                        if utc_time:
                            kickoff_str = utc_time
                        else:
                            kickoff_str = f"{today.isoformat()}T21:00:00Z"
                        
                        # Get short names (3 letters)
                        home_name = home_team.get("shortName", home_team.get("name", "???"))[:3].upper()
                        away_name = away_team.get("shortName", away_team.get("name", "???"))[:3].upper()
                        
                        # Scores
                        home_score = home_team.get("score")
                        away_score = away_team.get("score")
                        
                        # Status
                        is_finished = status.get("finished", False)
                        is_started = status.get("started", False)
                        
                        all_fixtures.append({
                            "competition": "CL",
                            "home": home_name,
                            "away": away_name,
                            "home_score": home_score,
                            "away_score": away_score,
                            "kickoff": kickoff_str,
                            "started": is_started,
                            "finished": is_finished
                        })
                        print(f"Added CL: {home_name} vs {away_name}")
    except Exception as e:
        print(f"Error fetching CL data: {e}")
    
    # Sort by kickoff time
    all_fixtures.sort(key=lambda x: x["kickoff"])
    
    # Show widget if there are matches today OR FPL deadline today
    show_widget = len(all_fixtures) > 0 or deadline_info is not None
    
    print(f"Football API: {len(all_fixtures)} fixtures, show={show_widget}")
    
    return jsonify({
        "show": show_widget,
        "deadline": deadline_info,
        "fixtures": all_fixtures
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
