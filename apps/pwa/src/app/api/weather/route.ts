import { NextResponse, type NextRequest } from 'next/server';
import { withSafety } from '@/lib/api-safety';

async function handler(req: NextRequest) {
  try {
    // Coordenadas de Indaiatuba, SP
    const lat = -23.0903;
    const lon = -47.2181;
    
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&timezone=America%2FSao_Paulo&forecast_days=1`
    );

    if (!response.ok) {
      throw new Error('Falha ao buscar dados do Open-Meteo');
    }

    const data = await response.json();

    // Mapear os dados para o formato esperado pelo widget
    const weatherData = {
      current: {
        temp: Math.round(data.current.temperature_2m),
        weather_code: data.current.weather_code
      },
      hourly: data.hourly.time.map((time: string, index: number) => ({
        time: new Date(time).getHours(),
        temp: Math.round(data.hourly.temperature_2m[index]),
        weather_code: data.hourly.weather_code[index]
      })).filter((_: any, index: number) => {
        // Filtrar apenas as próximas horas a partir de agora
        const hour = new Date(data.hourly.time[index]).getHours();
        const currentHour = new Date().getHours();
        // Pegar as próximas 8 horas (considerando virada do dia se necessário, mas forecast_days=1 simplifica)
        return index >= currentHour && index < currentHour + 8;
      }),
      city: 'Indaiatuba, SP'
    };

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Erro ao buscar clima:', error);
    return NextResponse.json({ error: 'Erro ao carregar dados do clima.' }, { status: 500 });
  }
}

export const GET = withSafety(handler, { route: 'weather', timeoutMs: 9000 });