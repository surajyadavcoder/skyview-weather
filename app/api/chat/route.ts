import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const { question, weather, forecast } = await req.json();

    if (!question || !weather) {
      return NextResponse.json({ error: 'Question and weather data required' }, { status: 400 });
    }

    const next24h = forecast?.list?.slice(0, 8) || [];
    const rainChance = next24h.length ? Math.max(...next24h.map((f: any) => f.pop * 100)) : 0;
    const maxWind = next24h.length ? Math.max(...next24h.map((f: any) => f.wind.speed * 3.6)) : 0;

    const systemPrompt = `You are a friendly, witty local weather assistant. You help people make practical everyday decisions based on current weather conditions. You know the weather data for the user's location and answer questions conversationally — like a smart friend who happens to know the weather, not like a weather report.

Current weather in ${weather.name}, ${weather.sys.country}:
- Temperature: ${Math.round(weather.main.temp)}°C, feels like ${Math.round(weather.main.feels_like)}°C
- Condition: ${weather.weather[0].description}
- Humidity: ${weather.main.humidity}%
- Wind: ${Math.round(weather.wind.speed * 3.6)} km/h
- Visibility: ${(weather.visibility / 1000).toFixed(1)} km

Next 24 hours:
- Rain probability: ${Math.round(rainChance)}%
- Max wind: ${Math.round(maxWind)} km/h

Rules:
- Answer in 2-3 sentences max
- Be direct and helpful
- Add a relevant emoji at the start
- Give a clear YES/NO recommendation when asked
- Be conversational, not robotic
- If asked something not weather-related, politely redirect to weather topics`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'Sorry, I could not process that. Try again!';

    return NextResponse.json({ answer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
