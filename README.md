# MMM-AnimatedWeather

A MagicMirror² module that displays current weather conditions using the [Open-Meteo API](https://open-meteo.com/) with animated SVG icons. No API key required.

## Features

- Animated SVG weather icons
- Current temperature and conditions
- Feels like temperature, humidity, and wind speed
- Sunrise and sunset times
- Hourly forecast
- No API key required

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
        latitude: 50.8315,
        longitude: -0.1457,
        locationName: "Brighton",
        animateAllIcons: false
    }
}
```

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `latitude` | Location latitude (required) | `0` |
| `longitude` | Location longitude (required) | `0` |
| `locationName` | Name shown in header | `""` |
| `units` | Unit system: `metric` or `imperial` | `"metric"` |
| `updateInterval` | Update frequency in minutes | `10` |
| `showTemperature` | Show current temperature | `true` |
| `showFeelsLike` | Show "feels like" temperature | `true` |
| `showHumidity` | Show humidity percentage | `true` |
| `showWind` | Show wind speed | `true` |
| `showSummary` | Show weather description | `true` |
| `showForecast` | Show hourly forecast | `true` |
| `forecastHours` | Number of forecast hours to show | `6` |
| `animateAllIcons` | Animate all icons (false = only main icon animated) | `false` |
| `iconSize` | Size of main weather icon in pixels | `100` |
| `roundTemp` | Round temperatures to whole numbers | `true` |

### Unit Systems

| Unit | Temperature | Wind Speed |
|------|-------------|------------|
| `metric` | Celsius | km/h |
| `imperial` | Fahrenheit | mph |

## Example Configuration

```js
{
    module: "MMM-AnimatedWeather",
    position: "top_right",
    config: {
        latitude: 51.5074,
        longitude: -0.1278,
        locationName: "London",
        units: "metric",
        updateInterval: 15,
        showForecast: true,
        forecastHours: 4,
        iconSize: 100
    }
}
```

## License

MIT License
