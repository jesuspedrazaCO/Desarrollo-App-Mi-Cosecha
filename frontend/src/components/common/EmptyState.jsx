export default function EmptyState({ icon = '🌱', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-float-up">
      <div className="w-16 h-16 rounded-3xl bg-primary-50 flex items-center justify-center text-3xl mb-4 shadow-soft">
        {icon}
      </div>
      <p className="font-bold text-stone-800 text-[16px] font-display">{title}</p>
      {description && <p className="text-stone-400 text-sm mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
