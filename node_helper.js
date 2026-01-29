/* MagicMirror²
 * Node Helper: MMM-AnimatedWeather
 *
 * By rhodrihughes
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const https = require("https");

module.exports = NodeHelper.create({
	start: function() {
		console.log("Starting node helper for: " + this.name);
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === "GET_WEATHER") {
			this.getWeatherData(payload);
		}
	},

	getWeatherData: function(config) {
		const self = this;
		const units = config.units === "imperial" ? "imperial" : "metric";
		
		// Fetch current weather
		const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${config.latitude}&lon=${config.longitude}&appid=${config.apiKey}&units=${units}&lang=${config.language}`;
		
		// Fetch forecast
		const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${config.latitude}&lon=${config.longitude}&appid=${config.apiKey}&units=${units}&lang=${config.language}&cnt=6`;

		console.log("[MMM-AnimatedWeather] Fetching weather data from OpenWeatherMap...");

		let currentData = null;
		let forecastData = null;
		let completed = 0;

		const checkComplete = () => {
			completed++;
			if (completed === 2) {
				if (currentData) {
					currentData.forecast = forecastData?.list || [];
					self.sendSocketNotification("WEATHER_DATA", currentData);
				}
			}
		};

		// Get current weather
		https.get(currentUrl, (res) => {
			let data = "";
			res.on("data", (chunk) => { data += chunk; });
			res.on("end", () => {
				if (res.statusCode === 200) {
					try {
						currentData = JSON.parse(data);
						console.log("[MMM-AnimatedWeather] Current weather received");
					} catch (error) {
						console.error("[MMM-AnimatedWeather] Error parsing current weather:", error);
						self.sendSocketNotification("WEATHER_ERROR", "Error parsing weather data");
					}
				} else {
					console.error("[MMM-AnimatedWeather] API error:", res.statusCode);
					self.sendSocketNotification("WEATHER_ERROR", `API Error: ${res.statusCode}`);
				}
				checkComplete();
			});
		}).on("error", (error) => {
			console.error("[MMM-AnimatedWeather] Request error:", error);
			self.sendSocketNotification("WEATHER_ERROR", "Network error: " + error.message);
			checkComplete();
		});

		// Get forecast
		https.get(forecastUrl, (res) => {
			let data = "";
			res.on("data", (chunk) => { data += chunk; });
			res.on("end", () => {
				if (res.statusCode === 200) {
					try {
						forecastData = JSON.parse(data);
						console.log("[MMM-AnimatedWeather] Forecast received");
					} catch (error) {
						console.error("[MMM-AnimatedWeather] Error parsing forecast:", error);
					}
				}
				checkComplete();
			});
		}).on("error", (error) => {
			console.error("[MMM-AnimatedWeather] Forecast request error:", error);
			checkComplete();
		});
	}
});
