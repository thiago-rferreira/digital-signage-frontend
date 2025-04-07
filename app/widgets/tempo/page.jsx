'use client';

import { useEffect, useState } from 'react';
import styles from './tempo.module.css';

const cities = [
  { name: 'Campinas', lat: -22.90, lon: -47.06 },
  { name: 'Valinhos', lat: -22.97, lon: -46.99 },
  { name: 'São Paulo', lat: -23.55, lon: -46.63 },
  { name: 'Rio de Janeiro', lat: -22.90, lon: -43.20 },
  { name: 'Brasília', lat: -15.78, lon: -47.93 },
];

export default function TempoWidget() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchWeather = async () => {
      const results = await Promise.all(
        cities.map(async (city) => {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code&timezone=auto`
          );
          const json = await res.json();
          return {
            name: city.name,
            temp: Math.round(json.current.temperature_2m),
            code: json.current.weather_code,
          };
        })
      );
      setData(results);
    };

    fetchWeather();
  }, []);

  const weatherDescription = (code) => {
    const map = {
      0: 'Céu limpo ☀️',
      1: 'Parcialmente nublado 🌤️',
      2: 'Nuvens dispersas ☁️',
      3: 'Nublado ☁️',
      45: 'Neblina 🌫️',
      48: 'Neblina intensa 🌁',
      51: 'Chuvisco 🌦️',
      61: 'Chuva leve 🌧️',
      63: 'Chuva moderada 🌧️',
      65: 'Chuva forte ⛈️',
      71: 'Neve leve ❄️',
      80: 'Pancadas 🌦️',
    };
    return map[code] || 'Tempo desconhecido';
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Previsão do Tempo</h1>
      <div className={styles.grid}>
        {data.map((item, idx) => (
          <div key={idx} className={styles.card}>
            <div className={styles.city}>{item.name}</div>
            <div className={styles.temp}>{item.temp}°C</div>
            <div className={styles.desc}>{weatherDescription(item.code)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
