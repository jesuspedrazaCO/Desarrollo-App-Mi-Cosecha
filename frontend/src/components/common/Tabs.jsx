export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-white/60 backdrop-blur-md rounded-full border border-white/60 shadow-soft w-fit overflow-x-auto max-w-full">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all duration-200 ease-smooth
            ${active === tab.key
              ? 'bg-primary-600 text-white shadow-soft'
              : 'text-stone-600 hover:bg-white/80'
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
