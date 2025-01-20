import { NextResponse } from "next/server";

export const fetchCache = "force-cache";

interface WeatherData {
  temperature: { min: number; max: number };
  humidity: number;
  pressure: number;
  wind_speed: number;
}

interface RawWeatherData {
  main: {
    temp_min: number;
    temp_max: number;
    humidity: number;
    pressure: number;
  };
  wind: {
    speed: number;
  };
}

/**
 * Fetch weather data from OpenWeather API.
 * @param capital - The capital city for which to fetch weather data.
 * @param apiKey - The OpenWeather API key.
 * @returns Raw weather data from OpenWeather API.
 */

async function fetchWeatherData(
  capital: string,
  apiKey: string
): Promise<RawWeatherData> {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${capital}&appid=${apiKey}&units=metric`
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      `OpenWeather API Error (status ${response.status}): ${errorBody}`
    );
    throw new Error(`Failed to fetch weather data for "${capital}"`);
  }

  const data: unknown = await response.json();
  return data as RawWeatherData;
}

/**
 * Validate raw weather data and transform it into WeatherData.
 * @param data - Raw weather data from OpenWeather API.
 * @returns Transformed weather data in `WeatherData` format.
 */

function validateWeatherData(data: RawWeatherData): WeatherData {
  const { main, wind } = data;

  if (!main || !wind) {
    throw new Error("Missing required fields in weather data");
  }

  return {
    temperature: { min: main.temp_min, max: main.temp_max },
    humidity: main.humidity,
    pressure: main.pressure,
    wind_speed: wind.speed,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const capital = searchParams.get("capital");
    const widget = searchParams.get("widget");

    if (!capital) {
      console.error("Error: No capital provided");
      return NextResponse.json(
        { error: "No capital provided in query parameters" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.error("Error: Missing API key");
      return NextResponse.json(
        { error: "Missing OPENWEATHER_API_KEY in environment variables" },
        { status: 500 }
      );
    }

    const rawWeatherData = await fetchWeatherData(capital, apiKey);

    const weatherData = validateWeatherData(rawWeatherData);

    if (widget) {
      const widgetData = {
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        pressure: weatherData.pressure,
        wind_speed: weatherData.wind_speed,
      }[widget as keyof WeatherData];

      if (widgetData === undefined) {
        console.error(`Error: Invalid widget "${widget}"`);
        return NextResponse.json(
          { error: `Invalid widget: "${widget}"` },
          { status: 400 }
        );
      }

      return NextResponse.json({ [widget]: widgetData });
    }

    return NextResponse.json(weatherData, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (error: unknown) {
    console.error("Unexpected error:", (error as Error).message);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
