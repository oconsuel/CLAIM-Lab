export default function PracticeToggle({ label, description, enabled, onChange }) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
        enabled
          ? 'bg-white border-slate-200'
          : 'bg-slate-50 border-slate-200 opacity-50'
      }`}
    >
      <div className="mr-4">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer ${
          enabled ? 'bg-slate-800' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
