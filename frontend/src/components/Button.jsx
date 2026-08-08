const VARIANTS = {
  primary:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-600 disabled:bg-gray-200 disabled:text-black-300',
  secondary:
    'bg-white text-black-900 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-red-600 disabled:text-black-300 disabled:border-gray-200',
  destructive:
    'bg-white text-red-600 border border-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-700 active:bg-red-100 focus-visible:ring-red-600 disabled:text-black-300 disabled:border-gray-200',
};

export default function Button({ as: Component = 'button', variant = 'primary', className = '', ...props }) {
  return (
    <Component
      className={`inline-flex items-center justify-center gap-2 rounded font-sans font-medium text-sm h-10 px-4 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
