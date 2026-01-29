/* MagicMirror²
 * Module: MMM-AnimatedWeather
 *
 * Displays current weather using OpenWeatherMap API with animated SVG icons
 * By rhodrihughes
 * MIT Licensed.
 */

Module.register("MMM-AnimatedWeather", {
	defaults: {
		apiKey: "",
		latitude: 0,
		longitude: 0,
		units: "metric", // metric or imperial
		updateInterval: 10, // minutes
		animationSpeed: 1000,
		showTemperature: true,
		showFeelsLike: true,
		showHumidity: true,
		showWind: true,
		showSummary: true,
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
		this.locationName = null;
		this.loaded = false;
		this.error = null;

		if (!this.config.apiKey) {
			this.error = "Please set your OpenWeatherMap API key in the config.";
			this.updateDom();
			return;
		}

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
			apiKey: this.config.apiKey,
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
			this.locationName = payload.name || null;
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
		if (this.locationName) {
			return `${this.locationName}'s Weather`;
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

		if (!this.weatherData) {
			wrapper.innerHTML = '<div class="weather-error">No weather data available</div>';
			return wrapper;
		}

		const weather = this.weatherData;
		const iconCode = weather.weather?.[0]?.icon;
		const description = weather.weather?.[0]?.description;

		// Top row: Icon + Temperature
		const topRow = document.createElement("div");
		topRow.className = "weather-top-row";

		// Icon
		const iconWrapper = document.createElement("div");
		iconWrapper.className = "weather-icon-wrapper";
		const icon = document.createElement("img");
		icon.className = "weather-icon";
		icon.src = this.file(`icons/fill/${this.getIconFile(iconCode)}`);
		icon.style.width = `${this.config.iconSize}px`;
		icon.style.height = `${this.config.iconSize}px`;
		icon.alt = description || "Weather";
		iconWrapper.appendChild(icon);
		topRow.appendChild(iconWrapper);

		// Temperature
		if (this.config.showTemperature && weather.main?.temp !== undefined) {
			const tempWrapper = document.createElement("div");
			tempWrapper.className = "weather-temp";
			tempWrapper.innerHTML = `${this.formatTemp(weather.main.temp)}°`;
			topRow.appendChild(tempWrapper);
		}

		wrapper.appendChild(topRow);

		// Weather description
		if (this.config.showSummary && description) {
			const summaryWrapper = document.createElement("div");
			summaryWrapper.className = "weather-summary";
			summaryWrapper.innerHTML = description;
			wrapper.appendChild(summaryWrapper);
		}

		// Details row: Feels like, Humidity, Wind
		const detailsWrapper = document.createElement("div");
		detailsWrapper.className = "weather-details";

		if (this.config.showFeelsLike && weather.main?.feels_like !== undefined) {
			const feelsLike = document.createElement("div");
			feelsLike.className = "weather-feelslike";
			const feelsIcon = document.createElement("img");
			feelsIcon.src = this.file("icons/fill/thermometer-glass.svg");
			feelsIcon.className = "detail-icon";
			feelsLike.appendChild(feelsIcon);
			const feelsText = document.createElement("span");
			feelsText.innerHTML = `${this.formatTemp(weather.main.feels_like)}°`;
			feelsLike.appendChild(feelsText);
			detailsWrapper.appendChild(feelsLike);
		}

		if (this.config.showHumidity && weather.main?.humidity !== undefined) {
			const humidity = document.createElement("div");
			humidity.className = "weather-humidity";
			const humidityIcon = document.createElement("img");
			humidityIcon.src = this.file("icons/fill/humidity.svg");
			humidityIcon.className = "detail-icon";
			humidity.appendChild(humidityIcon);
			const humidityText = document.createElement("span");
			humidityText.innerHTML = `${weather.main.humidity}%`;
			humidity.appendChild(humidityText);
			detailsWrapper.appendChild(humidity);
		}

		if (this.config.showWind && weather.wind?.speed !== undefined) {
			const wind = document.createElement("div");
			wind.className = "weather-wind";
			const windIcon = document.createElement("img");
			windIcon.src = this.file("icons/fill/wind.svg");
			windIcon.className = "detail-icon";
			wind.appendChild(windIcon);
			const windText = document.createElement("span");
			const windUnit = this.config.units === "imperial" ? "mph" : "m/s";
			windText.innerHTML = `${Math.round(weather.wind.speed)} ${windUnit}`;
			wind.appendChild(windText);
			detailsWrapper.appendChild(wind);
		}

		wrapper.appendChild(detailsWrapper);

		// Sun row: Sunrise and Sunset
		if (weather.sys?.sunrise && weather.sys?.sunset) {
			const sunWrapper = document.createElement("div");
			sunWrapper.className = "weather-sun";

			const sunriseDiv = document.createElement("div");
			sunriseDiv.className = "weather-sunrise";
			const sunriseIcon = document.createElement("img");
			sunriseIcon.src = this.file("icons/fill/sunrise.svg");
			sunriseIcon.className = "sun-icon";
			sunriseDiv.appendChild(sunriseIcon);
			const sunriseTime = document.createElement("span");
			sunriseTime.innerHTML = this.formatTime(weather.sys.sunrise);
			sunriseDiv.appendChild(sunriseTime);
			sunWrapper.appendChild(sunriseDiv);

			const sunsetDiv = document.createElement("div");
			sunsetDiv.className = "weather-sunset";
			const sunsetIcon = document.createElement("img");
			sunsetIcon.src = this.file("icons/fill/sunset.svg");
			sunsetIcon.className = "sun-icon";
			sunsetDiv.appendChild(sunsetIcon);
			const sunsetTime = document.createElement("span");
			sunsetTime.innerHTML = this.formatTime(weather.sys.sunset);
			sunsetDiv.appendChild(sunsetTime);
			sunWrapper.appendChild(sunsetDiv);

			wrapper.appendChild(sunWrapper);
		}

		// Hourly forecast row
		if (weather.forecast && weather.forecast.length > 0) {
			const forecastWrapper = document.createElement("div");
			forecastWrapper.className = "weather-forecast";

			weather.forecast.slice(0, 4).forEach((hour) => {
				const hourDiv = document.createElement("div");
				hourDiv.className = "forecast-hour";

				const timeDiv = document.createElement("div");
				timeDiv.className = "forecast-time";
				timeDiv.innerHTML = this.formatTime(hour.dt);
				hourDiv.appendChild(timeDiv);

				const iconImg = document.createElement("img");
				iconImg.className = "forecast-icon";
				iconImg.src = this.file(`icons/fill/${this.getIconFile(hour.weather?.[0]?.icon)}`);
				hourDiv.appendChild(iconImg);

				const tempDiv = document.createElement("div");
				tempDiv.className = "forecast-temp";
				tempDiv.innerHTML = `${this.formatTemp(hour.main?.temp)}°`;
				hourDiv.appendChild(tempDiv);

				forecastWrapper.appendChild(hourDiv);
			});

			wrapper.appendChild(forecastWrapper);
		}

		return wrapper;
	},

	// Format unix timestamp to time string
	formatTime: function(timestamp) {
		const date = new Date(timestamp * 1000);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	},

	// Format temperature
	formatTemp: function(temp) {
		if (this.config.roundTemp) {
			return Math.round(temp);
		}
		return temp.toFixed(1);
	},

	// Map OpenWeatherMap icon code to animated SVG file
	getIconFile: function(iconCode) {
		const iconMap = {
			"01d": "clear-day.svg",
			"01n": "clear-night.svg",
			"02d": "partly-cloudy-day.svg",
			"02n": "partly-cloudy-night.svg",
			"03d": "cloudy.svg",
			"03n": "cloudy.svg",
			"04d": "overcast-day.svg",
			"04n": "overcast-night.svg",
			"09d": "drizzle.svg",
			"09n": "drizzle.svg",
			"10d": "partly-cloudy-day-rain.svg",
			"10n": "partly-cloudy-night-rain.svg",
			"11d": "thunderstorms-day.svg",
			"11n": "thunderstorms-night.svg",
			"13d": "snow.svg",
			"13n": "snow.svg",
			"50d": "fog-day.svg",
			"50n": "fog-night.svg"
		};
		return iconMap[iconCode] || "not-available.svg";
	}
});
