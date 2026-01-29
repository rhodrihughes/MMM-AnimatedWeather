/* MagicMirror²
 * Module: MMM-AnimatedWeather
 *
 * Displays current weather using Open-Meteo API with animated SVG icons
 * By rhodrihughes
 * MIT Licensed.
 */

Module.register("MMM-AnimatedWeather", {
	defaults: {
		latitude: 0,
		longitude: 0,
		locationName: "",
		units: "metric", // metric or imperial
		updateInterval: 10, // minutes
		animationSpeed: 1000,
		showTemperature: true,
		showFeelsLike: true,
		showHumidity: true,
		showWind: true,
		showSummary: true,
		showForecast: true,
		forecastHours: 6,
		iconSize: 100,
		language: config.language || "en",
		roundTemp: true
	},

	// Required scripts
	getScripts: function() {
		return ["moment.js"];
	},

	// Required styles
	getStyles: function() {
		return [this.file("MMM-AnimatedWeather.css")];
	},

	// Start the module
	start: function() {
		Log.info("Starting module: " + this.name);
		this.weatherData = null;
		this.loaded = false;
		this.error = null;

		if (!this.config.latitude || !this.config.longitude) {
			this.error = "Please set latitude and longitude in the config.";
			this.updateDom();
			return;
		}

		this.getData();
		this.scheduleUpdate();
	},

	// Schedule next update
	scheduleUpdate: function() {
		const intervalMs = this.config.updateInterval * 60 * 1000;
		setInterval(() => {
			this.getData();
		}, intervalMs);
	},

	// Request weather data from node_helper
	getData: function() {
		this.sendSocketNotification("GET_WEATHER", {
			latitude: this.config.latitude,
			longitude: this.config.longitude,
			units: this.config.units,
			language: this.config.language
		});
	},

	// Handle socket notifications from node_helper
	socketNotificationReceived: function(notification, payload) {
		if (notification === "WEATHER_DATA") {
			this.weatherData = payload;
			this.loaded = true;
			this.error = null;
			this.updateDom(this.config.animationSpeed);
		} else if (notification === "WEATHER_ERROR") {
			this.error = payload;
			this.loaded = true;
			this.updateDom(this.config.animationSpeed);
		}
	},

	// Override getHeader to show location name
	getHeader: function() {
		if (this.config.locationName) {
			return `${this.config.locationName}'s Weather`;
		}
		return this.data.header || "";
	},

	// Generate the DOM
	getDom: function() {
		const wrapper = document.createElement("div");
		wrapper.className = "mmm-animated-weather";

		if (this.error) {
			wrapper.innerHTML = `<div class="weather-error">${this.error}</div>`;
			return wrapper;
		}

		if (!this.loaded) {
			wrapper.innerHTML = '<div class="weather-loading">Loading weather...</div>';
			return wrapper;
		}

		if (!this.weatherData || !this.weatherData.current) {
			wrapper.innerHTML = '<div class="weather-error">No weather data available</div>';
			return wrapper;
		}

		const current = this.weatherData.current;
		const daily = this.weatherData.daily;
		const hourly = this.weatherData.hourly;
		const isDay = current.is_day === 1;

		// Top row: Icon + Temperature
		const topRow = document.createElement("div");
		topRow.className = "weather-top-row";

		// Icon
		const iconWrapper = document.createElement("div");
		iconWrapper.className = "weather-icon-wrapper";
		const icon = document.createElement("img");
		icon.className = "weather-icon";
		icon.src = this.file(`icons/fill/${this.getIconFile(current.weather_code, isDay)}`);
		icon.style.width = `${this.config.iconSize}px`;
		icon.style.height = `${this.config.iconSize}px`;
		icon.alt = this.getWeatherDescription(current.weather_code);
		iconWrapper.appendChild(icon);
		topRow.appendChild(iconWrapper);

		// Temperature
		if (this.config.showTemperature && current.temperature_2m !== undefined) {
			const tempWrapper = document.createElement("div");
			tempWrapper.className = "weather-temp";
			tempWrapper.innerHTML = `${this.formatTemp(current.temperature_2m)}°`;
			topRow.appendChild(tempWrapper);
		}

		wrapper.appendChild(topRow);

		// Weather description
		if (this.config.showSummary) {
			const summaryWrapper = document.createElement("div");
			summaryWrapper.className = "weather-summary";
			summaryWrapper.innerHTML = this.getWeatherDescription(current.weather_code);
			wrapper.appendChild(summaryWrapper);
		}

		// Details row: Feels like, Humidity, Wind
		const detailsWrapper = document.createElement("div");
		detailsWrapper.className = "weather-details";

		if (this.config.showFeelsLike && current.apparent_temperature !== undefined) {
			const feelsLike = document.createElement("div");
			feelsLike.className = "weather-feelslike";
			const feelsIcon = document.createElement("img");
			feelsIcon.src = this.file("icons/fill/thermometer-glass.svg");
			feelsIcon.className = "detail-icon";
			feelsLike.appendChild(feelsIcon);
			const feelsText = document.createElement("span");
			feelsText.innerHTML = `${this.formatTemp(current.apparent_temperature)}°`;
			feelsLike.appendChild(feelsText);
			detailsWrapper.appendChild(feelsLike);
		}

		if (this.config.showHumidity && current.relative_humidity_2m !== undefined) {
			const humidity = document.createElement("div");
			humidity.className = "weather-humidity";
			const humidityIcon = document.createElement("img");
			humidityIcon.src = this.file("icons/fill/humidity.svg");
			humidityIcon.className = "detail-icon";
			humidity.appendChild(humidityIcon);
			const humidityText = document.createElement("span");
			humidityText.innerHTML = `${current.relative_humidity_2m}%`;
			humidity.appendChild(humidityText);
			detailsWrapper.appendChild(humidity);
		}

		if (this.config.showWind && current.wind_speed_10m !== undefined) {
			const wind = document.createElement("div");
			wind.className = "weather-wind";
			const windIcon = document.createElement("img");
			windIcon.src = this.file("icons/fill/wind.svg");
			windIcon.className = "detail-icon";
			wind.appendChild(windIcon);
			const windText = document.createElement("span");
			const windUnit = this.config.units === "imperial" ? "mph" : "km/h";
			windText.innerHTML = `${Math.round(current.wind_speed_10m)} ${windUnit}`;
			wind.appendChild(windText);
			detailsWrapper.appendChild(wind);
		}

		wrapper.appendChild(detailsWrapper);

		// Sun row: Sunrise and Sunset
		if (daily?.sunrise?.[0] && daily?.sunset?.[0]) {
			const sunWrapper = document.createElement("div");
			sunWrapper.className = "weather-sun";

			const sunriseDiv = document.createElement("div");
			sunriseDiv.className = "weather-sunrise";
			const sunriseIcon = document.createElement("img");
			sunriseIcon.src = this.file("icons/fill/sunrise.svg");
			sunriseIcon.className = "sun-icon";
			sunriseDiv.appendChild(sunriseIcon);
			const sunriseTime = document.createElement("span");
			sunriseTime.innerHTML = this.formatTimeFromISO(daily.sunrise[0]);
			sunriseDiv.appendChild(sunriseTime);
			sunWrapper.appendChild(sunriseDiv);

			const sunsetDiv = document.createElement("div");
			sunsetDiv.className = "weather-sunset";
			const sunsetIcon = document.createElement("img");
			sunsetIcon.src = this.file("icons/fill/sunset.svg");
			sunsetIcon.className = "sun-icon";
			sunsetDiv.appendChild(sunsetIcon);
			const sunsetTime = document.createElement("span");
			sunsetTime.innerHTML = this.formatTimeFromISO(daily.sunset[0]);
			sunsetDiv.appendChild(sunsetTime);
			sunWrapper.appendChild(sunsetDiv);

			wrapper.appendChild(sunWrapper);
		}

		// Hourly forecast row
		if (this.config.showForecast && hourly?.time && hourly?.temperature_2m) {
			const forecastWrapper = document.createElement("div");
			forecastWrapper.className = "weather-forecast";

			// Get current hour index
			const now = new Date();
			const currentHourIndex = hourly.time.findIndex(t => new Date(t) > now);
			const startIndex = currentHourIndex > 0 ? currentHourIndex : 0;

			for (let i = startIndex; i < startIndex + this.config.forecastHours && i < hourly.time.length; i++) {
				const hourDiv = document.createElement("div");
				hourDiv.className = "forecast-hour";

				const timeDiv = document.createElement("div");
				timeDiv.className = "forecast-time";
				timeDiv.innerHTML = this.formatTimeFromISO(hourly.time[i]);
				hourDiv.appendChild(timeDiv);

				const iconImg = document.createElement("img");
				iconImg.className = "forecast-icon";
				// Determine if it's day based on hour
				const hourDate = new Date(hourly.time[i]);
				const hour = hourDate.getHours();
				const forecastIsDay = hour >= 6 && hour < 20;
				iconImg.src = this.file(`icons/fill/${this.getIconFile(hourly.weather_code?.[i] || 0, forecastIsDay)}`);
				hourDiv.appendChild(iconImg);

				const tempDiv = document.createElement("div");
				tempDiv.className = "forecast-temp";
				tempDiv.innerHTML = `${this.formatTemp(hourly.temperature_2m[i])}°`;
				hourDiv.appendChild(tempDiv);

				forecastWrapper.appendChild(hourDiv);
			}

			wrapper.appendChild(forecastWrapper);
		}

		return wrapper;
	},

	// Format ISO timestamp to time string
	formatTimeFromISO: function(isoString) {
		const date = new Date(isoString);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	},

	// Format temperature
	formatTemp: function(temp) {
		if (this.config.roundTemp) {
			return Math.round(temp);
		}
		return temp.toFixed(1);
	},

	// Get weather description from WMO code
	getWeatherDescription: function(code) {
		const descriptions = {
			0: "Clear sky",
			1: "Mainly clear",
			2: "Partly cloudy",
			3: "Overcast",
			45: "Foggy",
			48: "Depositing rime fog",
			51: "Light drizzle",
			53: "Moderate drizzle",
			55: "Dense drizzle",
			61: "Slight rain",
			63: "Moderate rain",
			65: "Heavy rain",
			66: "Light freezing rain",
			67: "Heavy freezing rain",
			71: "Slight snow",
			73: "Moderate snow",
			75: "Heavy snow",
			77: "Snow grains",
			80: "Slight rain showers",
			81: "Moderate rain showers",
			82: "Violent rain showers",
			85: "Slight snow showers",
			86: "Heavy snow showers",
			95: "Thunderstorm",
			96: "Thunderstorm with slight hail",
			99: "Thunderstorm with heavy hail"
		};
		return descriptions[code] || "Unknown";
	},

	// Map WMO weather code to animated SVG file
	getIconFile: function(code, isDay) {
		const dayNight = isDay ? "day" : "night";
		
		const iconMap = {
			0: isDay ? "clear-day.svg" : "clear-night.svg",
			1: isDay ? "clear-day.svg" : "clear-night.svg",
			2: isDay ? "partly-cloudy-day.svg" : "partly-cloudy-night.svg",
			3: isDay ? "overcast-day.svg" : "overcast-night.svg",
			45: isDay ? "fog-day.svg" : "fog-night.svg",
			48: isDay ? "fog-day.svg" : "fog-night.svg",
			51: "drizzle.svg",
			53: "drizzle.svg",
			55: "drizzle.svg",
			61: isDay ? "partly-cloudy-day-rain.svg" : "partly-cloudy-night-rain.svg",
			63: "rain.svg",
			65: "rain.svg",
			66: "sleet.svg",
			67: "sleet.svg",
			71: isDay ? "partly-cloudy-day-snow.svg" : "partly-cloudy-night-snow.svg",
			73: "snow.svg",
			75: "snow.svg",
			77: "snow.svg",
			80: isDay ? "partly-cloudy-day-rain.svg" : "partly-cloudy-night-rain.svg",
			81: "rain.svg",
			82: "rain.svg",
			85: isDay ? "partly-cloudy-day-snow.svg" : "partly-cloudy-night-snow.svg",
			86: "snow.svg",
			95: isDay ? "thunderstorms-day.svg" : "thunderstorms-night.svg",
			96: isDay ? "thunderstorms-day.svg" : "thunderstorms-night.svg",
			99: isDay ? "thunderstorms-day.svg" : "thunderstorms-night.svg"
		};
		return iconMap[code] || "not-available.svg";
	}
});
