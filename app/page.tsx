"use client";

import React, { useCallback, useEffect, useState } from "react";
import WeatherWidget from "./components/WeatherWidget";
import styles from "./page.module.css";

type Country = {
  name: string;
  capital: string;
  code: string;
};

type WeatherData = {
  temperature: { min: number; max: number };
  humidity: number;
  pressure: number;
  wind_speed: number;
};

const DEFAULT_COUNTRY_CODE = "DE";

export default function HomePage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY_CODE);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [refreshing, setRefreshing] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch("/api/countries");
        const data = await res.json();

        if (res.ok) {
          setCountries(data);
        } else {
          throw new Error(data.error || "Failed to fetch countries.");
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
        setErrorMessage("Failed to load countries. Please try again later.");
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    const country = countries.find((c) => c.code === selectedCountry);
    if (country) {
      fetchWeather(country.capital);
    }
  }, [selectedCountry, countries]);

  const fetchWeather = async (capital: string) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetch(`/api/weather?capital=${capital}`);
      const data = await res.json();

      if (res.ok) {
        setWeather(data);
      } else {
        throw new Error(data.error || "Failed to fetch weather data.");
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
      setWeather(null);
      setErrorMessage(
        "Failed to load weather data. Please refresh or try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchWidgetData = async (
    capital: string,
    widget: keyof WeatherData
  ) => {
    try {
      setRefreshing((prev) => ({ ...prev, [widget]: true }));
      const res = await fetch(
        `/api/weather?capital=${capital}&widget=${widget}`
      );
      const data = await res.json();

      if (res.ok) {
        setWeather(
          (prev) =>
            ({
              ...prev,
              [widget]: data[widget],
            } as WeatherData)
        );
      } else {
        throw new Error(data.error || `Failed to fetch ${widget} data.`);
      }
    } catch (error) {
      console.error(`Error fetching ${widget} data:`, error);
      setErrorMessage(`Failed to refresh ${widget} data.`);
    } finally {
      setRefreshing((prev) => ({ ...prev, [widget]: false }));
    }
  };

  const handleWidgetRefresh = useCallback(
    (widget: keyof WeatherData) => {
      const country = countries.find((c) => c.code === selectedCountry);
      if (country) {
        fetchWidgetData(country.capital, widget);
      }
    },
    [countries, selectedCountry]
  );

  const handleDismissError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Weather Dashboard</h1>

      {errorMessage && (
        <div className={styles.errorMessage}>
          <p>{errorMessage}</p>
          <button onClick={handleDismissError} className={styles.errorDismiss}>
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className={styles.loaderContainer}>
          <div className={styles.loader}></div>
        </div>
      ) : weather ? (
        <>
          <div className={styles.selectContainer}>
            <label htmlFor="country-select" className={styles.label}>
              Select a Country:
            </label>
            <select
              id="country-select"
              className={styles.select}
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.widgetsContainer}>
            <WeatherWidget
              label="Temp (Min/Max)"
              value={`${weather.temperature.min}°C / ${weather.temperature.max}°C`}
              onRefresh={() => handleWidgetRefresh("temperature")}
              refreshing={refreshing["temperature"]}
            />
            <WeatherWidget
              label="Wind Speed (m/s)"
              value={`${weather.wind_speed} m/s`}
              onRefresh={() => handleWidgetRefresh("wind_speed")}
              refreshing={refreshing["wind_speed"]}
            />
            <WeatherWidget
              label="Humidity"
              value={`${weather.humidity}%`}
              onRefresh={() => handleWidgetRefresh("humidity")}
              refreshing={refreshing["humidity"]}
            />
            <WeatherWidget
              label="Pressure (hPa)"
              value={`${weather.pressure} hPa`}
              onRefresh={() => handleWidgetRefresh("pressure")}
              refreshing={refreshing["pressure"]}
            />
          </div>
        </>
      ) : (
        <div className={styles.noDataContainer}>
          <p className={styles.noData}>No weather data available.</p>
        </div>
      )}
    </div>
  );
}
