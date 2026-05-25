const WMO_CODES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

function classifyPerils(dayData) {
  const perils = [];

  if ([96, 99].includes(dayData.weathercode)) {
    perils.push({
      type: 'Hail',
      severity: dayData.weathercode === 99 ? 'Severe' : 'Moderate',
      details: WMO_CODES[dayData.weathercode],
    });
  }

  if (dayData.windgusts_max >= 58) {
    const severity =
      dayData.windgusts_max >= 75 ? 'Extreme' : dayData.windgusts_max >= 65 ? 'Severe' : 'Moderate';
    perils.push({
      type: 'Wind',
      severity,
      details: `Max gusts: ${dayData.windgusts_max.toFixed(1)} mph`,
    });
  }

  if ([95, 96, 99].includes(dayData.weathercode)) {
    perils.push({
      type: 'Thunderstorm',
      severity: dayData.weathercode >= 96 ? 'Severe' : 'Moderate',
      details: WMO_CODES[dayData.weathercode],
    });
  }

  if (dayData.precipitation > 2.0) {
    const severity =
      dayData.precipitation > 4.0 ? 'Severe' : dayData.precipitation > 3.0 ? 'Moderate' : 'Minor';
    perils.push({
      type: 'Heavy Rain / Flooding',
      severity,
      details: `Precipitation: ${dayData.precipitation.toFixed(2)} inches`,
    });
  }

  if (
    [71, 73, 75, 77, 85, 86].includes(dayData.weathercode) &&
    dayData.temp_min <= 32
  ) {
    const severity = dayData.precipitation > 1.0 ? 'Severe' : 'Moderate';
    perils.push({
      type: 'Winter Storm',
      severity,
      details: `${WMO_CODES[dayData.weathercode]}, Min temp: ${dayData.temp_min.toFixed(1)}°F`,
    });
  }

  if (dayData.windgusts_max >= 75 && [95, 96, 99].includes(dayData.weathercode)) {
    perils.push({
      type: 'Tornado Risk',
      severity: 'Extreme',
      details: `Thunderstorm with extreme gusts: ${dayData.windgusts_max.toFixed(1)} mph`,
    });
  }

  if ([56, 57, 66, 67].includes(dayData.weathercode)) {
    perils.push({
      type: 'Ice Storm',
      severity: dayData.weathercode >= 67 ? 'Severe' : 'Moderate',
      details: WMO_CODES[dayData.weathercode],
    });
  }

  return perils;
}

function celsiusToFahrenheit(c) {
  return (c * 9) / 5 + 32;
}

function mmToInches(mm) {
  return mm / 25.4;
}

function kmhToMph(kmh) {
  return kmh * 0.621371;
}

async function fetchWeatherData(latitude, longitude, startDate, endDate) {
  const url = new URL('https://archive-api.open-meteo.com/v1/archive');
  url.searchParams.set('latitude', latitude);
  url.searchParams.set('longitude', longitude);
  url.searchParams.set('start_date', startDate);
  url.searchParams.set('end_date', endDate);
  url.searchParams.set(
    'daily',
    'weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,windgusts_10m_max'
  );
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('windspeed_unit', 'kmh');
  url.searchParams.set('precipitation_unit', 'mm');
  url.searchParams.set('timezone', 'America/New_York');

  const response = await fetch(url.toString());
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Open-Meteo API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  if (!data.daily || !data.daily.time) {
    throw new Error('No weather data available for the specified location and date range');
  }

  const days = data.daily.time.map((date, i) => {
    const tempMax = celsiusToFahrenheit(data.daily.temperature_2m_max[i] ?? 0);
    const tempMin = celsiusToFahrenheit(data.daily.temperature_2m_min[i] ?? 0);
    const precipitation = mmToInches(data.daily.precipitation_sum[i] ?? 0);
    const windspeedMax = kmhToMph(data.daily.windspeed_10m_max[i] ?? 0);
    const windgustsMax = kmhToMph(data.daily.windgusts_10m_max[i] ?? 0);
    const weathercode = data.daily.weathercode[i] ?? 0;

    const dayData = {
      date,
      weathercode,
      weather_description: WMO_CODES[weathercode] || 'Unknown',
      temp_max: tempMax,
      temp_min: tempMin,
      precipitation,
      windspeed_max: windspeedMax,
      windgusts_max: windgustsMax,
    };

    dayData.perils = classifyPerils(dayData);
    return dayData;
  });

  return days;
}

function generateInsights(weatherDays, dateOfLoss) {
  const totalDays = weatherDays.length;
  const perilDays = weatherDays.filter((d) => d.perils.length > 0);
  const dolData = weatherDays.find((d) => d.date === dateOfLoss);

  const perilCounts = {};
  perilDays.forEach((d) => {
    d.perils.forEach((p) => {
      perilCounts[p.type] = (perilCounts[p.type] || 0) + 1;
    });
  });

  const avgTemp =
    weatherDays.reduce((sum, d) => sum + (d.temp_max + d.temp_min) / 2, 0) / totalDays;
  const avgPrecip =
    weatherDays.reduce((sum, d) => sum + d.precipitation, 0) / totalDays;
  const avgWindspeed =
    weatherDays.reduce((sum, d) => sum + d.windspeed_max, 0) / totalDays;
  const maxWindGust = Math.max(...weatherDays.map((d) => d.windgusts_max));
  const maxPrecipDay = weatherDays.reduce(
    (max, d) => (d.precipitation > max.precipitation ? d : max),
    weatherDays[0]
  );

  const monthlyPerils = {};
  perilDays.forEach((d) => {
    const month = d.date.substring(0, 7);
    monthlyPerils[month] = (monthlyPerils[month] || 0) + d.perils.length;
  });

  return {
    summary: {
      total_days: totalDays,
      peril_days: perilDays.length,
      peril_percentage: ((perilDays.length / totalDays) * 100).toFixed(1),
      avg_temperature: avgTemp.toFixed(1),
      avg_daily_precipitation: avgPrecip.toFixed(3),
      avg_windspeed: avgWindspeed.toFixed(1),
      max_wind_gust: maxWindGust.toFixed(1),
      max_precipitation_day: {
        date: maxPrecipDay.date,
        amount: maxPrecipDay.precipitation.toFixed(2),
      },
    },
    peril_frequency: perilCounts,
    date_of_loss: dolData || null,
    monthly_peril_trend: monthlyPerils,
  };
}

module.exports = { fetchWeatherData, generateInsights, WMO_CODES };
