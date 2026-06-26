export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-full border border-white/12 w-fit overflow-x-auto max-w-full"
      style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all duration-200
            ${active === tab.key
              ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-[0_2px_8px_rgba(37,138,78,0.4)]'
              : 'text-white/55 hover:text-white/85 hover:bg-white/10'
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
