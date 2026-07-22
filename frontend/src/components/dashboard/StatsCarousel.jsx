import { useRef, useState, useEffect, Children } from 'react'

export default function StatsCarousel({ children }) {
  const scrollRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const items = Children.toArray(children)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.firstChild?.offsetWidth || 1
    const gap = 12
    const index = Math.round(el.scrollLeft / (cardWidth + gap))
    setActiveIndex(Math.min(index, items.length - 1))
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-4 px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((child, i) => (
          <div key={i} className="snap-center shrink-0 w-[78%] first:ml-0">
            {child}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {items.map((_, i) => (
            <span
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === activeIndex ? '16px' : '5px',
                height: '5px',
                background: i === activeIndex ? '#4ade80' : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}