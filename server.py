from flask import Flask, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)
STOP_ID = 'NSR:StopPlace:30918' #møhlenpris

@app.route('/departures')
def departures():
	url= f'https://api.entur.io/realtime/v1/departureBoard?id={STOP_ID}'
	headers = {"ET-Client-Name": "smarthub-prosjekt"}

	try:
		r = requests.get(url, headers=headers)
		r.rai3000se_for_status()
		return jsonify(r.json())
	except requests.exceptions.RequestException as e:
		return jsoinfy({"error": str(e)}), 500
3000
if __name__ == "__main__":
	app.run(host="0.0.0.0", port=5000)

