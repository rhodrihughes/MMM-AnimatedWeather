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
		
		// Open-Meteo API - no key required
		const params = new URLSearchParams({
			latitude: config.latitude,
			longitude: config.longitude,
			current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day",
			hourly: "temperature_2m,weather_code",
			daily: "sunrise,sunset",
			timezone: "auto",
			forecast_days: 1,
			forecast_hours: 12
		});

		if (config.units === "imperial") {
			params.append("temperature_unit", "fahrenheit");
			params.append("wind_speed_unit", "mph");
		}

		const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

		console.log("[MMM-AnimatedWeather] Fetching weather data from Open-Meteo...");

		https.get(url, (res) => {
			let data = "";

			res.on("data", (chunk) => {
				data += chunk;
			});

			res.on("end", () => {
				if (res.statusCode === 200) {
					try {
						const weatherData = JSON.parse(data);
						console.log("[MMM-AnimatedWeather] Weather data received successfully");
						self.sendSocketNotification("WEATHER_DATA", weatherData);
					} catch (error) {
						console.error("[MMM-AnimatedWeather] Error parsing weather data:", error);
						self.sendSocketNotification("WEATHER_ERROR", "Error parsing weather data");
					}
				} else {
					console.error("[MMM-AnimatedWeather] API error:", res.statusCode);
					self.sendSocketNotification("WEATHER_ERROR", `API Error: ${res.statusCode}`);
				}
			});
		}).on("error", (error) => {
			console.error("[MMM-AnimatedWeather] Request error:", error);
			self.sendSocketNotification("WEATHER_ERROR", "Network error: " + error.message);
		});
	}
});
