/**
 * Componente de campo de formulario reutilizable
 */
export function FormField({ 
  label, 
  name, 
  value, 
  onChange, 
  type = "text", 
  required = false, 
  className = "" 
}) {
  return (
    <div className={className}>
      <label className="block text-xs text-gray-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

/**
 * Campo de formulario para datos bancarios (sin required)
 */
export function BankField({ 
  label, 
  name, 
  value, 
  onChange, 
  type = "text", 
  className = "" 
}) {
  return (
    <div className={className}>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
