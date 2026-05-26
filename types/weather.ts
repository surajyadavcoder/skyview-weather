export interface WeatherData {
  name: string;
  sys: { country: string; sunrise: number; sunset: number };
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
    pressure: number;
  };
  weather: { id: number; main: string; description: string; icon: string }[];
  wind: { speed: number; deg: number };
  visibility: number;
  clouds: { all: number };
  coord: { lat: number; lon: number };
  dt: number;
}

export interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
    feels_like: number;
  };
  weather: { id: number; main: string; description: string; icon: string }[];
  wind: { speed: number };
  dt_txt: string;
  pop: number;
}

export interface ForecastData {
  list: ForecastItem[];
  city: { name: string; country: string };
}

export interface GeoCity {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}
