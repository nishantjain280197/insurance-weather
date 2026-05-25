const PERIL_COLORS = {
  Hail: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  Wind: { bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/30' },
  Thunderstorm: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30' },
  'Heavy Rain / Flooding': { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
  'Winter Storm': { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/30' },
  'Tornado Risk': { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' },
  'Ice Storm': { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
};

const SEVERITY_INDICATOR = {
  Minor: 'bg-green-400',
  Moderate: 'bg-yellow-400',
  Severe: 'bg-orange-400',
  Extreme: 'bg-red-500',
};

export default function PerilBadge({ peril }) {
  const colors = PERIL_COLORS[peril.type] || { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_INDICATOR[peril.severity] || 'bg-gray-400'}`} />
      {peril.type}
      <span className="opacity-60">({peril.severity})</span>
    </span>
  );
}
