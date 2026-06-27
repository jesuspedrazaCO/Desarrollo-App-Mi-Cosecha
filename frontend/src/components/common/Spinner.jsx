export default function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-11 h-11' }
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`${sizes[size]} border-[3px] border-white/20 border-t-emerald-400 rounded-full animate-spin`} />
    </div>
  )
}
