export default function Field({ label, error, required, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium uppercase tracking-wide text-black-700 mb-1">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {error && <span className="block text-sm text-red-700 mt-1">{error}</span>}
    </label>
  );
}

export function inputClasses(hasError) {
  return `w-full h-10 px-3 rounded border bg-white text-black-900 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-black-900/15 ${
    hasError ? 'border-red-600' : 'border-gray-300 focus:border-black-900'
  }`;
}
