import { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, Legend, PieChart, Pie,
} from 'recharts';
import PerilBadge from './PerilBadge';

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <p className="text-storm-400 text-sm">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color || 'text-white'}`}>{value}</p>
      {sub && <p className="text-storm-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function MonthlyChart({ data, dateOfLoss }) {
  const dolMonth = dateOfLoss?.substring(0, 7);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="month"
          stroke="#748ffc"
          tick={{ fill: '#748ffc', fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis stroke="#748ffc" tick={{ fill: '#748ffc', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1e3a5f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
        />
        <Bar dataKey="peril_events" name="Peril Events" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.month}
              fill={entry.month === dolMonth ? '#ff6b6b' : '#4c6ef5'}
              fillOpacity={entry.month === dolMonth ? 1 : 0.7}
            />
          ))}
        </Bar>
        {dolMonth && <ReferenceLine x={dolMonth} stroke="#ff6b6b" strokeDasharray="5 5" label={{ value: 'DOL', fill: '#ff6b6b', fontSize: 12 }} />}
      </BarChart>
    </ResponsiveContainer>
  );
}

function TemperatureChart({ data, dateOfLoss }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4c6ef5" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="month" stroke="#748ffc" tick={{ fill: '#748ffc', fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis stroke="#748ffc" tick={{ fill: '#748ffc', fontSize: 11 }} unit="°F" />
        <Tooltip
          contentStyle={{ background: '#1e3a5f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
          formatter={(val) => [`${val.toFixed(1)}°F`]}
        />
        <Area type="monotone" dataKey="avg_temp_max" name="Avg High" stroke="#ff6b6b" fill="url(#tempGrad)" />
        <Area type="monotone" dataKey="avg_temp_min" name="Avg Low" stroke="#4c6ef5" fill="transparent" />
        {dateOfLoss && (
          <ReferenceLine x={dateOfLoss.substring(0, 7)} stroke="#ff6b6b" strokeDasharray="5 5" />
        )}
        <Legend />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function PrecipitationChart({ data, dateOfLoss }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="month" stroke="#748ffc" tick={{ fill: '#748ffc', fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis stroke="#748ffc" tick={{ fill: '#748ffc', fontSize: 11 }} unit="in" />
        <Tooltip
          contentStyle={{ background: '#1e3a5f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
          formatter={(val) => [`${val.toFixed(2)} in`]}
        />
        <Line type="monotone" dataKey="total_precip" name="Total Precipitation" stroke="#339af0" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="max_windgust" name="Max Wind Gust (mph)" stroke="#fcc419" strokeWidth={2} dot={false} />
        {dateOfLoss && (
          <ReferenceLine x={dateOfLoss.substring(0, 7)} stroke="#ff6b6b" strokeDasharray="5 5" label={{ value: 'DOL', fill: '#ff6b6b', fontSize: 12 }} />
        )}
        <Legend />
      </LineChart>
    </ResponsiveContainer>
  );
}

const PERIL_COLORS_MAP = {
  Hail: '#22b8cf',
  Wind: '#20c997',
  Thunderstorm: '#fcc419',
  'Heavy Rain / Flooding': '#339af0',
  'Winter Storm': '#845ef7',
  'Tornado Risk': '#ff6b6b',
  'Ice Storm': '#cc5de8',
};

function PerilPieChart({ perilFrequency }) {
  const data = Object.entries(perilFrequency).map(([name, value]) => ({
    name,
    value,
    fill: PERIL_COLORS_MAP[name] || '#748ffc',
  }));

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: '#1e3a5f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default function Analytics({ data }) {
  const [perilFilter, setPerilFilter] = useState('all');

  const { monthlyData, perilDaysNearDol } = useMemo(() => {
    if (!data?.days) return { monthlyData: [], perilDaysNearDol: [] };

    const months = {};
    data.days.forEach((d) => {
      const m = d.date.substring(0, 7);
      if (!months[m]) {
        months[m] = { month: m, peril_events: 0, total_precip: 0, max_windgust: 0, temps_max: [], temps_min: [], days: 0 };
      }
      months[m].days += 1;
      months[m].peril_events += d.perils.length;
      months[m].total_precip += d.precipitation;
      months[m].max_windgust = Math.max(months[m].max_windgust, d.windgusts_max);
      months[m].temps_max.push(d.temp_max);
      months[m].temps_min.push(d.temp_min);
    });

    const monthly = Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({
        ...m,
        total_precip: parseFloat(m.total_precip.toFixed(2)),
        max_windgust: parseFloat(m.max_windgust.toFixed(1)),
        avg_temp_max: parseFloat((m.temps_max.reduce((s, v) => s + v, 0) / m.temps_max.length).toFixed(1)),
        avg_temp_min: parseFloat((m.temps_min.reduce((s, v) => s + v, 0) / m.temps_min.length).toFixed(1)),
      }));

    const dol = data.date_range?.date_of_loss;
    const dolDate = dol ? new Date(dol) : null;
    let nearDol = [];
    if (dolDate) {
      const windowStart = new Date(dolDate);
      windowStart.setDate(windowStart.getDate() - 30);
      const windowEnd = new Date(dolDate);
      windowEnd.setDate(windowEnd.getDate() + 1);
      nearDol = data.days
        .filter((d) => {
          const dd = new Date(d.date);
          return dd >= windowStart && dd <= windowEnd && d.perils.length > 0;
        })
        .sort((a, b) => b.date.localeCompare(a.date));
    }

    return { monthlyData: monthly, perilDaysNearDol: nearDol };
  }, [data]);

  if (!data) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10 text-center">
        <svg className="w-16 h-16 text-storm-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <h3 className="text-lg text-storm-300 font-medium">No analytics data</h3>
        <p className="text-storm-500 mt-1">Perform a weather search or select from history to view analytics</p>
      </div>
    );
  }

  const { insights, date_range, location } = data;
  const dateOfLoss = date_range?.date_of_loss;
  const dolData = insights?.date_of_loss;
  const allPerilTypes = insights?.peril_frequency ? Object.keys(insights.peril_frequency) : [];
  const filteredDays = data.days?.filter((d) =>
    d.perils.length > 0 && (perilFilter === 'all' || d.perils.some((p) => p.type === perilFilter))
  ) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Weather Analytics</h2>
        <p className="text-storm-400 mt-1">
          {[location?.city, location?.state].filter(Boolean).join(', ')} &mdash;{' '}
          {date_range?.start_date} to {date_range?.end_date}
        </p>
      </div>

      {/* Date of Loss Highlight */}
      {dolData && (
        <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-300">Date of Loss: {dateOfLoss}</h3>
              <p className="text-red-400/80 text-sm">Weather conditions on the reported loss date</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-red-400/60 text-xs">Weather</p>
              <p className="text-white font-medium">{dolData.weather_description}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-red-400/60 text-xs">Temperature</p>
              <p className="text-white font-medium">{dolData.temp_min?.toFixed(1)}°F - {dolData.temp_max?.toFixed(1)}°F</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-red-400/60 text-xs">Precipitation</p>
              <p className="text-white font-medium">{dolData.precipitation?.toFixed(2)} in</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-red-400/60 text-xs">Max Wind Gust</p>
              <p className="text-white font-medium">{dolData.windgusts_max?.toFixed(1)} mph</p>
            </div>
          </div>

          {dolData.perils?.length > 0 ? (
            <div>
              <p className="text-red-400/80 text-sm mb-2">Perils Detected on Date of Loss:</p>
              <div className="flex flex-wrap gap-2">
                {dolData.perils.map((p, i) => (
                  <PerilBadge key={i} peril={p} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-red-400/60 text-sm">No significant perils detected on this date</p>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {insights?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Days Analyzed" value={insights.summary.total_days} />
          <StatCard label="Days with Perils" value={insights.summary.peril_days} sub={`${insights.summary.peril_percentage}% of period`} color="text-yellow-400" />
          <StatCard label="Avg Temperature" value={`${insights.summary.avg_temperature}°F`} />
          <StatCard label="Max Wind Gust" value={`${insights.summary.max_wind_gust} mph`} sub={`Heaviest rain: ${insights.summary.max_precipitation_day?.amount} in on ${insights.summary.max_precipitation_day?.date}`} color="text-teal-400" />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Peril Events</h3>
          <MonthlyChart data={monthlyData} dateOfLoss={dateOfLoss} />
        </div>

        {insights?.peril_frequency && Object.keys(insights.peril_frequency).length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Peril Distribution</h3>
            <PerilPieChart perilFrequency={insights.peril_frequency} />
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Temperature Trends</h3>
          <TemperatureChart data={monthlyData} dateOfLoss={dateOfLoss} />
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Precipitation &amp; Wind</h3>
          <PrecipitationChart data={monthlyData} dateOfLoss={dateOfLoss} />
        </div>
      </div>

      {/* Peril Days near Date of Loss */}
      {perilDaysNearDol.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">
            Peril Events Near Date of Loss (30-day window)
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {perilDaysNearDol.map((d) => (
              <div
                key={d.date}
                className={`p-4 rounded-xl border ${
                  d.date === dateOfLoss
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-white/5 border-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${d.date === dateOfLoss ? 'text-red-300' : 'text-white'}`}>
                      {d.date}
                    </span>
                    {d.date === dateOfLoss && (
                      <span className="px-2 py-0.5 bg-red-500/30 text-red-200 text-xs rounded-full font-medium">
                        DATE OF LOSS
                      </span>
                    )}
                  </div>
                  <span className="text-storm-400 text-xs">{d.weather_description}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {d.perils.map((p, i) => (
                    <PerilBadge key={i} peril={p} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Peril Event Log */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            All Peril Events ({filteredDays.length} days)
          </h3>
          <select
            value={perilFilter}
            onChange={(e) => setPerilFilter(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-storm-500"
          >
            <option value="all" className="bg-gray-800">All Perils</option>
            {allPerilTypes.map((type) => (
              <option key={type} value={type} className="bg-gray-800">{type}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredDays.slice(0, 200).map((d) => (
            <div
              key={d.date}
              className={`flex items-center justify-between p-3 rounded-lg ${
                d.date === dateOfLoss ? 'bg-red-500/10 border border-red-500/30' : 'bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-sm font-mono ${d.date === dateOfLoss ? 'text-red-300 font-bold' : 'text-storm-300'}`}>
                  {d.date}
                </span>
                {d.date === dateOfLoss && (
                  <span className="px-1.5 py-0.5 bg-red-500/30 text-red-200 text-[10px] rounded font-bold">DOL</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {d.perils
                  .filter((p) => perilFilter === 'all' || p.type === perilFilter)
                  .map((p, i) => (
                    <PerilBadge key={i} peril={p} />
                  ))}
              </div>
            </div>
          ))}
          {filteredDays.length > 200 && (
            <p className="text-storm-500 text-sm text-center py-2">
              Showing 200 of {filteredDays.length} peril days
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
