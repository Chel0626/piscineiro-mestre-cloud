'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Cloud, CloudRain, CloudSnow, CloudSun, Zap, CloudFog, Moon, Cloudy } from 'lucide-react';

interface WeatherData {
  current: {
    temp: number;
    weather_code: number;
  };
  hourly: {
    time: number;
    temp: number;
    weather_code: number;
  }[];
  city: string;
}

const getWeatherInfo = (code: number, hour: number): { description: string; Icon: React.ElementType } => {
  const isNight = hour >= 18 || hour < 6;
  if (code === 0 || code === 1) return { description: 'Céu limpo', Icon: isNight ? Moon : Sun };
  if (code === 2) return { description: 'Parcialmente nublado', Icon: isNight ? Cloudy : CloudSun };
  if (code === 3) return { description: 'Nublado', Icon: Cloud };
  if (code >= 45 && code <= 48) return { description: 'Nevoeiro', Icon: CloudFog };
  if (code >= 51 && code <= 57) return { description: 'Chuvisco', Icon: CloudRain };
  if (code >= 61 && code <= 67) return { description: 'Chuva', Icon: CloudRain };
  if (code >= 71 && code <= 77) return { description: 'Neve', Icon: CloudSnow };
  if (code >= 80 && code <= 82) return { description: 'Pancadas de chuva', Icon: CloudRain };
  if (code >= 95 && code <= 99) return { description: 'Trovoada', Icon: Zap };
  return { description: 'Desconhecido', Icon: isNight ? Moon : Sun };
};

const WeatherIcon = ({ code, hour, className }: { code: number; hour: number; className?: string }) => {
  const { Icon } = getWeatherInfo(code, hour);
  const iconColor = (hour >= 18 || hour < 6) ? "text-slate-400" : "text-yellow-400";
  return <Icon className={`${className || 'h-6 w-6 sm:h-8 sm:w-8'} ${iconColor}`} />;
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Buscar dados do tempo
    fetch('/api/weather')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Não foi possível carregar a previsão do tempo.');
        }
        return res.json();
      })
      .then((data) => setWeather(data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
        <CardHeader><CardTitle className="text-sm sm:text-base">Erro na Previsão do Tempo</CardTitle></CardHeader>
        <CardContent><p className="text-sm">{error}</p></CardContent>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader><CardTitle className="text-sm sm:text-base dark:text-white">Previsão do Tempo</CardTitle></CardHeader>
        <CardContent><p className="text-sm dark:text-gray-300">Carregando...</p></CardContent>
      </Card>
    );
  }

  // Verificar se os dados estão completos
  if (!weather.current || typeof weather.current.weather_code === 'undefined') {
    return (
      <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400">
        <CardHeader><CardTitle className="text-sm sm:text-base">Previsão do Tempo</CardTitle></CardHeader>
        <CardContent><p className="text-sm">Dados do tempo incompletos. Tente novamente em alguns minutos.</p></CardContent>
      </Card>
    );
  }

  const currentHour = new Date().getHours();
  const { description } = getWeatherInfo(weather.current.weather_code, currentHour);

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg dark:text-white">
            Previsão para {weather.city}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            
            {/* Left Side: Current */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-fit pr-4 sm:pr-6 border-r border-border">
                <WeatherIcon code={weather.current.weather_code} hour={currentHour} className="h-10 w-10 sm:h-12 sm:w-12" />
                <div>
                    <p className="text-3xl sm:text-4xl font-bold dark:text-white">{weather.current.temp}°</p>
                    <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 capitalize whitespace-nowrap">{description}</p>
                </div>
            </div>

            {/* Right Side: Next Hours */}
            <div className="flex gap-4 sm:gap-6 flex-1">
              {weather.hourly.slice(0, 5).map((hour, index) => (
                <div key={index} className="flex flex-col items-center gap-1 min-w-[40px]">
                  <span className="text-xs text-muted-foreground">{hour.time}h</span>
                  <WeatherIcon code={hour.weather_code} hour={hour.time} className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-sm font-bold dark:text-white">{hour.temp}°</span>
                </div>
              ))}
            </div>

        </div>
      </CardContent>
    </Card>
  );
}