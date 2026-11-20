// Shared UI atoms

export function DiffBadge({ difficulty }) {
  const cls =
    difficulty === 'EASY'   ? 'badge-easy' :
    difficulty === 'MEDIUM' ? 'badge-medium' : 'badge-hard';
  return <span className={cls}>{difficulty}</span>;
}

export function FreqBar({ value }) {
  const pct = Math.min(value || 0, 100);
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[11px] font-mono">
        <span className="text-slate-400">Score</span>
        <span className="font-bold text-slate-200">{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Spinner({ className = '' }) {
  return (
    <div className={`animate-spin rounded-full border-4 border-amber-500 border-t-transparent ${className}`} />
  );
}

export function SectionEmpty({ icon: Icon, title, sub, action }) {
  return (
    <div className="py-16 text-center space-y-3">
      <Icon className="w-12 h-12 mx-auto text-slate-600" />
      <h4 className="text-base font-semibold text-slate-200">{title}</h4>
      <p className="text-xs text-slate-500">{sub}</p>
      {action}
    </div>
  );
}
