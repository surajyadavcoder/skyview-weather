export function getWeatherBackground(weatherId: number, isDay: boolean): string {
  if (weatherId >= 200 && weatherId < 300) {
    return 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'; // Thunderstorm
  } else if (weatherId >= 300 && weatherId < 400) {
    return 'linear-gradient(135deg, #4a6274 0%, #3d5166 50%, #2c3e50 100%)'; // Drizzle
  } else if (weatherId >= 500 && weatherId < 600) {
    return 'linear-gradient(135deg, #373b44 0%, #4286f4 100%)'; // Rain
  } else if (weatherId >= 600 && weatherId < 700) {
    return 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)'; // Snow
  } else if (weatherId >= 700 && weatherId < 800) {
    return 'linear-gradient(135deg, #b8c6db 0%, #f5f7fa 100%)'; // Mist/Fog
  } else if (weatherId === 800) {
    return isDay
      ? 'linear-gradient(135deg, #2980b9 0%, #6dd5fa 50%, #ffffff 100%)' // Clear day
      : 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'; // Clear night
  } else if (weatherId > 800) {
    return isDay
      ? 'linear-gradient(135deg, #667db6 0%, #0082c8 50%, #0082c8 100%)' // Cloudy day
      : 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)'; // Cloudy night
  }
  return 'linear-gradient(135deg, #2980b9 0%, #6dd5fa 100%)';
}

export function getWeatherEmoji(weatherId: number): string {
  if (weatherId >= 200 && weatherId < 300) return '⛈️';
  if (weatherId >= 300 && weatherId < 400) return '🌦️';
  if (weatherId >= 500 && weatherId < 600) return '🌧️';
  if (weatherId >= 600 && weatherId < 700) return '❄️';
  if (weatherId >= 700 && weatherId < 800) return '🌫️';
  if (weatherId === 800) return '☀️';
  if (weatherId === 801) return '🌤️';
  if (weatherId === 802) return '⛅';
  if (weatherId >= 803) return '☁️';
  return '🌡️';
}

export function formatTime(unix: number, offset = 0): string {
  const date = new Date((unix + offset) * 1000);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
}

export function formatDay(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString('en-US', { weekday: 'short' });
}

export function getWindDirection(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

export function isDay(sunrise: number, sunset: number, current: number): boolean {
  return current >= sunrise && current <= sunset;
}

export function groupForecastByDay(list: any[]) {
  const days: Record<string, any[]> = {};
  list.forEach(item => {
    const day = item.dt_txt.split(' ')[0];
    if (!days[day]) days[day] = [];
    days[day].push(item);
  });
  return Object.entries(days).slice(0, 7);
}
