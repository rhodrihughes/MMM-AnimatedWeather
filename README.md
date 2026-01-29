# MMM-AnimatedWeather

A MagicMirror² module that displays current weather conditions using the [OpenWeatherMap API](https://openweathermap.org/) with animated SVG icons.

## Features

- Animated SVG weather icons
- Current temperature
- Feels like temperature
- Humidity and wind speed
- Customizable display options

## Installation

Navigate to your MagicMirror's modules folder:

```bash
cd ~/MagicMirror/modules
git clone https://github.com/rhodrihughes/MMM-AnimatedWeather
```

No additional dependencies required.

## Configuration

Add the module to your `config/config.js` file:

```js
{
    module: "MMM-AnimatedWeather",
    position: "top_right",
    config: {
        apiKey: "YOUR_OPENWEATHERMAP_API_KEY",
        latitude: 50.8315,
        longitude: -0.1457,
        units: "metric"
    }
}
```

### Getting an OpenWeatherMap API Key

1. Visit [openweathermap.org](https://openweathermap.org/api)
2. Sign up for a free account
3. Go to API keys in your account
4. Copy your API key

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `apiKey` | Your OpenWeatherMap API key (required) | `""` |
| `latitude` | Location latitude (required) | `0` |
| `longitude` | Location longitude (required) | `0` |
| `units` | Unit system: `metric` or `imperial` | `"metric"` |
| `updateInterval` | Update frequency in minutes | `10` |
| `showTemperature` | Show current temperature | `true` |
| `showFeelsLike` | Show "feels like" temperature | `true` |
| `showHumidity` | Show humidity percentage | `true` |
| `showWind` | Show wind speed | `true` |
| `showSummary` | Show weather description | `true` |
| `iconSize` | Size of weather icon in pixels | `100` |
| `roundTemp` | Round temperatures to whole numbers | `true` |
| `animationSpeed` | DOM update animation speed in ms | `1000` |

### Unit Systems

| Unit | Temperature | Wind Speed |
|------|-------------|------------|
| `metric` | Celsius | m/s |
| `imperial` | Fahrenheit | mph |

## Example Configuration

```js
{
    module: "MMM-AnimatedWeather",
    position: "top_right",
    config: {
        apiKey: "YOUR_API_KEY",
        latitude: 51.5074,
        longitude: -0.1278,
        units: "metric",
        updateInterval: 15,
        showTemperature: true,
        showFeelsLike: true,
        showHumidity: true,
        showWind: true,
        showSummary: true,
        iconSize: 120,
        roundTemp: true
    }
}
```

## License

MIT License
