import { themeBg, themeStatCard, type Theme } from './themeUtils'

interface Stat { value: string; label: string }
interface Props { theme?: Theme; stats: Stat[] }

export function StatsRow({ theme = 'gray', stats }: Props) {
  const cols = Math.min(stats.length, 4)
  return (
    <section className={`py-16 ${themeBg(theme)}`}>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className={`grid grid-cols-2 md:grid-cols-${cols} gap-6`}>
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`p-8 border-l-4 border-[#B8946A] ${themeStatCard(theme)}`}
              style={{ clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)' }}
            >
              <div className="text-4xl mb-2" style={{ fontWeight: 700 }}>{stat.value}</div>
              <div className="text-sm tracking-wider uppercase">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
