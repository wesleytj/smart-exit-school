import { useState, forwardRef } from "react"
import { Lock, Eye, EyeOff } from "lucide-react"

const PasswordInput = forwardRef(function PasswordInput(
  {
    value,
    onChange,
    placeholder = "••••••••",
    autoComplete = "current-password",
    id,
    name,
    required = false,
    className = "",
    showLockIcon = true,
    disabled = false,
    autoFocus = false,
    ...props
  },
  ref
) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative w-full">
      {showLockIcon && (
        <Lock
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          size={20}
          aria-hidden="true"
        />
      )}
      <input
        ref={ref}
        type={show ? "text" : "password"}
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 ${
          showLockIcon ? "pl-12" : "pl-4"
        } pr-12 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition text-slate-900 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((prev) => !prev)}
        disabled={disabled}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={show}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {show ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
  )
})

export default PasswordInput
