export default function EmptyState({ icon = '🌱', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-float-up">
      <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mb-4"
        style={{ background: 'rgba(37,138,78,0.15)', border: '1px solid rgba(74,222,128,0.2)' }}>
        {icon}
      </div>
      <p className="font-bold text-white/85 text-[16px] font-display">{title}</p>
      {description && <p className="text-white/40 text-sm mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
