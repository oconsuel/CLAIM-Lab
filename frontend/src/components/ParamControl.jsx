import Button from './ui/Button'

export default function ParamControl({ param, value, onChange }) {
  if (param.type === 'slider') {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <label className="text-slate-600">{param.label}</label>
          <span className="font-mono text-slate-800">{value}</span>
        </div>
        <input
          type="range"
          min={param.min}
          max={param.max}
          step={param.step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full accent-slate-700"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>{param.min}</span>
          <span>{param.max}</span>
        </div>
        {param.hint && (
          <p className="text-xs text-slate-400 leading-relaxed mt-1">{param.hint}</p>
        )}
      </div>
    )
  }

  if (param.type === 'buttons') {
    return (
      <div className="space-y-1">
        <label className={`text-sm text-slate-600 block ${param.labelClass || ''}`}>{param.label}</label>
        <div className="flex flex-wrap gap-1.5">
          {param.options.map(opt => {
            const optValue = typeof opt === 'object' ? opt.value : opt
            const optLabel = typeof opt === 'object' ? opt.label : String(opt)
            const isActive = String(value) === String(optValue)
            return (
              <Button
                key={optValue}
                variant="selector"
                selected={isActive}
                onClick={() => onChange(optValue)}
              >
                {optLabel}
              </Button>
            )
          })}
        </div>
        {param.hint && (
          <p className="text-xs text-slate-400 leading-relaxed mt-1">{param.hint}</p>
        )}
      </div>
    )
  }

  if (param.type === 'select') {
    return (
      <div className="space-y-1">
        <label className="text-sm text-slate-600">{param.label}</label>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:border-slate-400"
        >
          {param.options.map(opt => {
            const optValue = typeof opt === 'string' ? opt : opt.value
            const optLabel = typeof opt === 'string' ? opt : opt.label
            return <option key={optValue} value={optValue}>{optLabel}</option>
          })}
        </select>
        {param.hint && (
          <p className="text-xs text-slate-400 leading-relaxed mt-1">{param.hint}</p>
        )}
      </div>
    )
  }

  return null
}
