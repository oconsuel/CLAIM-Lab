/**
 * Единый компонент кнопок.
 * variant: 'primary' | 'secondary' | 'selector' | 'modeSwitch'
 * selector: selected — активное состояние для выбора
 * modeSwitch: для переключателя режимов (flex-1, другой активный стиль)
 */
const baseStyles = 'rounded-md text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

const variantStyles = {
  primary: 'px-6 py-2.5 bg-slate-800 text-white hover:bg-slate-700',
  secondary: 'px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
  ghost: 'px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200',
  selector: 'min-w-[2.5rem] px-3 py-2 border',
  selectorActive: 'bg-slate-800 text-white border-slate-800',
  selectorInactive: 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800',
  modeSwitch: 'flex-1 px-4 py-2',
  modeSwitchActive: 'bg-white text-slate-800 shadow-sm',
  modeSwitchInactive: 'text-slate-500 hover:text-slate-700',
}

export default function Button({
  as: Component = 'button',
  variant = 'secondary',
  selected,
  children,
  className = '',
  icon,
  iconPosition = 'right',
  ...props
}) {
  if (variant === 'selector') {
    const isActive = selected === true
    return (
      <Component
        className={`${baseStyles} ${variantStyles.selector} ${
          isActive ? variantStyles.selectorActive : variantStyles.selectorInactive
        } ${className}`.trim()}
        {...props}
      >
        {children}
      </Component>
    )
  }

  if (variant === 'modeSwitch') {
    const isActive = selected === true
    return (
      <Component
        className={`${baseStyles} ${variantStyles.modeSwitch} ${
          isActive ? variantStyles.modeSwitchActive : variantStyles.modeSwitchInactive
        } ${className}`.trim()}
        {...props}
      >
        {children}
      </Component>
    )
  }

  const styles = variantStyles[variant] || variantStyles.secondary
  const content = icon ? (
    <span className={`flex items-center gap-2 ${iconPosition === 'left' ? '' : 'flex-row-reverse'}`}>
      {icon}
      {children}
    </span>
  ) : (
    children
  )

  return (
    <Component className={`${baseStyles} ${styles} ${className}`.trim()} {...props}>
      {content}
    </Component>
  )
}
