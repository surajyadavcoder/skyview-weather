'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { WeatherData, ForecastData, GeoCity } from '@/types/weather';
import { getWeatherBackground, getWeatherEmoji, formatTime, formatDay, getWindDirection, isDay, groupForecastByDay } from '@/lib/utils';

interface AIAlert { icon: string; message: string; severity: 'info' | 'warning' | 'danger'; }
interface ChatMessage { role: 'user' | 'ai'; text: string; time: string; }

const SUGGESTED_QUESTIONS = [
  'Should I carry an umbrella today?',
  'Is it safe to ride a bike right now?',
  'Good day for outdoor workout?',
  'Should I wear a jacket?',
  'Is it okay to dry clothes outside?',
];

export default function WeatherApp() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<GeoCity[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [aiAlerts, setAiAlerts] = useState<AIAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);

  const bg = weather
    ? getWeatherBackground(weather.weather[0].id, isDay(weather.sys.sunrise, weather.sys.sunset, weather.dt))
    : 'linear-gradient(135deg, #2980b9 0%, #6dd5fa 50%, #2c3e50 100%)';

  const lightBg = 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e8f5e9 100%)';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchAIAlerts = useCallback(async (w: WeatherData, f: ForecastData) => {
    setAlertsLoading(true);
    try {
      const res = await axios.post('/api/ai-alert', { weather: w, forecast: f });
      setAiAlerts(res.data.alerts || []);
    } catch { setAiAlerts([]); }
    finally { setAlertsLoading(false); }
  }, []);

  const fetchWeather = useCallback(async (params: { city?: string; lat?: number; lon?: number }) => {
    setLoading(true);
    setError('');
    setAiAlerts([]);
    setChatMessages([]);
    try {
      const query = params.lat ? `lat=${params.lat}&lon=${params.lon}` : `city=${encodeURIComponent(params.city || '')}`;
      const [wRes, fRes] = await Promise.all([axios.get(`/api/weather?${query}`), axios.get(`/api/forecast?${query}`)]);
      setWeather(wRes.data);
      setForecast(fRes.data);
      setLastUpdated(new Date());
      fetchAIAlerts(wRes.data, fRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'City not found. Please try again.');
      setWeather(null); setForecast(null);
    } finally { setLoading(false); }
  }, [fetchAIAlerts]);

  const fetchByLocation = useCallback(() => {
    if (!navigator.geolocation) { setError('Geolocation not supported.'); return; }
    setLocating(true); setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); fetchWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude }); },
      () => { setLocating(false); setError('Location access denied. Please search for a city.'); }
    );
  }, [fetchWeather]);

  useEffect(() => { fetchByLocation(); }, []);

  useEffect(() => {
    if (!weather || !forecast) return;
    const interval = setInterval(() => fetchWeather({ lat: weather.coord.lat, lon: weather.coord.lon }), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [weather, forecast]);

  const handleSearchInput = (val: string) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    if (val.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await axios.get(`/api/search?q=${encodeURIComponent(val)}`);
      setSuggestions(res.data); setShowSuggestions(true);
    }, 400);
  };

  const handleSuggestionClick = (city: GeoCity) => {
    setSearch(`${city.name}, ${city.country}`);
    setShowSuggestions(false);
    fetchWeather({ lat: city.lat, lon: city.lon });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setShowSuggestions(false);
    fetchWeather({ city: search.trim() });
  };

  const sendChat = async (question: string) => {
    if (!question.trim() || !weather || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', text: question, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await axios.post('/api/chat', { question, weather, forecast });
      const aiMsg: ChatMessage = { role: 'ai', text: res.data.answer, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Sorry, couldn't process that. Try again!", time: '' }]);
    } finally { setChatLoading(false); }
  };

  const temp = (t: number) => unit === 'metric' ? `${Math.round(t)}°C` : `${Math.round(t * 9 / 5 + 32)}°F`;
  const dayForecast = forecast ? groupForecastByDay(forecast.list) : [];
  const dayNow = weather ? isDay(weather.sys.sunrise, weather.sys.sunset, weather.dt) : true;

  const alertColors: Record<string, { bg: string; border: string }> = {
    info: { bg: 'rgba(59,130,246,0.2)', border: 'rgba(59,130,246,0.4)' },
    warning: { bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.4)' },
    danger: { bg: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.4)' },
  };

  const isDark = darkMode;
  const textColor = isDark ? 'white' : '#1e293b';
  const subTextColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)';
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.08)';
  const inputBg = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.8)';
  const inputBorder = isDark ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(0,0,0,0.12)';

  return (
    <div style={{ minHeight: '100vh', background: isDark ? bg : lightBg, transition: 'background 1s ease', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -150, left: -100, width: 500, height: 500, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px', position: 'relative' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🌤️</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: textColor, letterSpacing: -0.5 }}>SkyView</div>
              <div style={{ fontSize: 11, color: subTextColor }}>
                {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Real-time weather'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setDarkMode(d => !d)} style={{ padding: '6px 14px', borderRadius: 20, border: inputBorder, background: inputBg, color: textColor, fontSize: 16, cursor: 'pointer' }}>
              {isDark ? '☀️' : '🌙'}
            </button>
            <button onClick={() => setUnit(u => u === 'metric' ? 'imperial' : 'metric')} style={{ padding: '6px 14px', borderRadius: 20, border: inputBorder, background: inputBg, color: textColor, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              °{unit === 'metric' ? 'C' : 'F'}
            </button>
            <button onClick={fetchByLocation} disabled={locating} style={{ padding: '6px 14px', borderRadius: 20, border: inputBorder, background: inputBg, color: textColor, fontSize: 13, cursor: 'pointer' }}>
              {locating ? '📡 Locating...' : '📍 My Location'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 28 }}>
          <form onSubmit={handleSearchSubmit}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🔍</span>
                <input value={search} onChange={e => handleSearchInput(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search city, town..."
                  style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 14, border: inputBorder, background: inputBg, backdropFilter: 'blur(20px)', color: textColor, fontSize: 15, outline: 'none' }}
                />
              </div>
              <button type="submit" style={{ padding: '14px 24px', borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                Search
              </button>
            </div>
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, borderRadius: 12, overflow: 'hidden', zIndex: 50, background: isDark ? 'rgba(20,20,40,0.95)' : 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(99,102,241,0.2)' }}>
              {suggestions.map((city, i) => (
                <div key={i} onMouseDown={() => handleSuggestionClick(city)}
                  style={{ padding: '12px 18px', cursor: 'pointer', color: textColor, fontSize: 14, borderBottom: i < suggestions.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` : 'none', display: 'flex', justifyContent: 'space-between' }}
                  onMouseOver={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.06)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span>📍 {city.name}{city.state ? `, ${city.state}` : ''}</span>
                  <span style={{ color: subTextColor, fontSize: 12 }}>{city.country}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: isDark ? 'white' : '#dc2626', marginBottom: 20, fontSize: 14 }}>⚠️ {error}</div>}

        {(loading || locating) && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: textColor }}>
            <div style={{ fontSize: 48, marginBottom: 16 }} className="animate-spin-slow">🌍</div>
            <div style={{ fontSize: 16, opacity: 0.8 }}>{locating ? 'Detecting your location...' : 'Fetching weather data...'}</div>
          </div>
        )}

        {weather && !loading && (
          <div className="animate-fade-in">

            {/* AI Alerts */}
            {(alertsLoading || aiAlerts.length > 0) && (
              <div style={{ borderRadius: 20, padding: '20px 24px', background: cardBg, backdropFilter: 'blur(20px)', border: cardBorder, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 16 }}>🤖</span>
                  <span style={{ fontSize: 13, color: subTextColor, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>AI Weather Alerts</span>
                </div>
                {alertsLoading ? (
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[1, 2].map(i => <div key={i} style={{ flex: 1, height: 52, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }} />)}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {aiAlerts.map((alert, i) => (
                      <div key={i} style={{ padding: '12px 16px', borderRadius: 12, background: alertColors[alert.severity]?.bg, border: `1px solid ${alertColors[alert.severity]?.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 22, flexShrink: 0 }}>{alert.icon}</span>
                        <span style={{ fontSize: 14, color: textColor, lineHeight: 1.4 }}>{alert.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Current Weather */}
            <div style={{ borderRadius: 24, padding: '32px', background: cardBg, backdropFilter: 'blur(20px)', border: cardBorder, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 14, color: subTextColor, marginBottom: 4 }}>📍 {weather.name}, {weather.sys.country}</div>
                  <div style={{ fontSize: 72, fontWeight: 800, color: textColor, lineHeight: 1, letterSpacing: -2 }}>{temp(weather.main.temp)}</div>
                  <div style={{ fontSize: 18, color: isDark ? 'rgba(255,255,255,0.85)' : '#374151', marginTop: 8, textTransform: 'capitalize' }}>
                    {getWeatherEmoji(weather.weather[0].id)} {weather.weather[0].description}
                  </div>
                  <div style={{ fontSize: 14, color: subTextColor, marginTop: 4 }}>
                    Feels like {temp(weather.main.feels_like)} · H: {temp(weather.main.temp_max)} · L: {temp(weather.main.temp_min)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 80 }} className="animate-pulse-slow">{getWeatherEmoji(weather.weather[0].id)}</div>
                  <div style={{ fontSize: 12, color: subTextColor, marginTop: 4 }}>{dayNow ? '☀️ Daytime' : '🌙 Nighttime'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 28 }}>
                {[
                  { icon: '💧', label: 'Humidity', value: `${weather.main.humidity}%` },
                  { icon: '🌬️', label: 'Wind', value: `${Math.round(weather.wind.speed * 3.6)} km/h ${getWindDirection(weather.wind.deg)}` },
                  { icon: '👁️', label: 'Visibility', value: `${(weather.visibility / 1000).toFixed(1)} km` },
                  { icon: '📊', label: 'Pressure', value: `${weather.main.pressure} hPa` },
                ].map(stat => (
                  <div key={stat.label} style={{ padding: '14px', borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.08)', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</div>
                    <div style={{ fontSize: 12, color: subTextColor, marginBottom: 2 }}>{stat.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                {[
                  { icon: '🌅', label: 'Sunrise', value: formatTime(weather.sys.sunrise) },
                  { icon: '🌇', label: 'Sunset', value: formatTime(weather.sys.sunset) },
                  { icon: '☁️', label: 'Cloud Cover', value: `${weather.clouds.all}%` },
                ].map(item => (
                  <div key={item.label} style={{ flex: 1, padding: '12px 16px', borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: 11, color: subTextColor }}>{item.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Weather Chat */}
            <div style={{ borderRadius: 24, background: cardBg, backdropFilter: 'blur(20px)', border: `2px solid ${showChat ? 'rgba(99,102,241,0.5)' : cardBorder.replace('1px', '')}`, marginBottom: 16, overflow: 'hidden', transition: 'all 0.3s' }}>
              <div onClick={() => setShowChat(s => !s)} style={{ padding: '18px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧠</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: textColor }}>Ask the Weather AI</div>
                    <div style={{ fontSize: 12, color: subTextColor }}>Should I carry an umbrella? Good for a run?</div>
                  </div>
                </div>
                <span style={{ fontSize: 18, color: subTextColor, transition: 'transform 0.3s', transform: showChat ? 'rotate(180deg)' : 'none' }}>▾</span>
              </div>

              {showChat && (
                <div style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}` }}>
                  {/* Suggested questions */}
                  {chatMessages.length === 0 && (
                    <div style={{ padding: '16px 24px' }}>
                      <div style={{ fontSize: 12, color: subTextColor, marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Try asking:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {SUGGESTED_QUESTIONS.map((q, i) => (
                          <button key={i} onClick={() => sendChat(q)} style={{
                            padding: '8px 14px', borderRadius: 20,
                            background: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)',
                            border: '1px solid rgba(99,102,241,0.3)',
                            color: isDark ? '#a5b4fc' : '#6366f1',
                            fontSize: 12, cursor: 'pointer', fontWeight: 500,
                          }}>
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat messages */}
                  {chatMessages.length > 0 && (
                    <div style={{ padding: '16px 24px', maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {chatMessages.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                            {msg.role === 'user' ? '👤' : '🤖'}
                          </div>
                          <div style={{ maxWidth: '75%' }}>
                            <div style={{ padding: '10px 14px', borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)', color: msg.role === 'user' ? 'white' : textColor, fontSize: 14, lineHeight: 1.5 }}>
                              {msg.text}
                            </div>
                            {msg.time && <div style={{ fontSize: 10, color: subTextColor, marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left' }}>{msg.time}</div>}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
                          <div style={{ padding: '10px 14px', borderRadius: '4px 16px 16px 16px', background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)', display: 'flex', gap: 4, alignItems: 'center' }}>
                            {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />)}
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}

                  {/* Chat input */}
                  <div style={{ padding: '12px 24px 20px', display: 'flex', gap: 10 }}>
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendChat(chatInput)}
                      placeholder="Ask anything about today's weather..."
                      style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: inputBorder, background: inputBg, color: textColor, fontSize: 14, outline: 'none' }}
                    />
                    <button onClick={() => sendChat(chatInput)} disabled={chatLoading || !chatInput.trim()} style={{ padding: '12px 20px', borderRadius: 12, background: chatInput.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', border: 'none', color: 'white', fontSize: 16, cursor: chatInput.trim() ? 'pointer' : 'not-allowed' }}>
                      ➤
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 7-Day Forecast */}
            {dayForecast.length > 0 && (
              <div style={{ borderRadius: 24, padding: '24px', background: cardBg, backdropFilter: 'blur(20px)', border: cardBorder, marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: subTextColor, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>7-Day Forecast</div>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                  {dayForecast.map(([date, items], i) => {
                    const maxT = Math.max(...items.map((it: any) => it.main.temp_max));
                    const minT = Math.min(...items.map((it: any) => it.main.temp_min));
                    const midItem = items[Math.floor(items.length / 2)];
                    const isToday = i === 0;
                    return (
                      <div key={date} style={{ flex: '0 0 auto', minWidth: 90, padding: '16px 12px', borderRadius: 16, textAlign: 'center', background: isToday ? 'rgba(99,102,241,0.25)' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', border: isToday ? '1px solid rgba(99,102,241,0.5)' : '1px solid transparent' }}>
                        <div style={{ fontSize: 12, color: isToday ? '#a5b4fc' : subTextColor, fontWeight: isToday ? 700 : 400, marginBottom: 8 }}>{isToday ? 'Today' : formatDay(midItem.dt)}</div>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{getWeatherEmoji(midItem.weather[0].id)}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>{temp(maxT)}</div>
                        <div style={{ fontSize: 12, color: subTextColor }}>{temp(minT)}</div>
                        {midItem.pop > 0 && <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 4 }}>💧 {Math.round(midItem.pop * 100)}%</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hourly */}
            {forecast && (
              <div style={{ borderRadius: 24, padding: '24px', background: cardBg, backdropFilter: 'blur(20px)', border: cardBorder }}>
                <div style={{ fontSize: 13, color: subTextColor, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Hourly Forecast</div>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                  {forecast.list.slice(0, 8).map((item, i) => (
                    <div key={i} style={{ flex: '0 0 auto', minWidth: 72, padding: '14px 10px', borderRadius: 16, textAlign: 'center', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                      <div style={{ fontSize: 11, color: subTextColor, marginBottom: 6 }}>
                        {i === 0 ? 'Now' : new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{getWeatherEmoji(item.weather[0].id)}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{temp(item.main.temp)}</div>
                      {item.pop > 0 && <div style={{ fontSize: 10, color: '#60a5fa', marginTop: 3 }}>{Math.round(item.pop * 100)}%</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: subTextColor }}>
          Powered by OpenWeatherMap · AI by Groq · Refreshes every 5 min
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-5px); } }
      `}</style>
    </div>
  );
}
