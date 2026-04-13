'use client'

import { motion } from 'framer-motion'
import type { BaziResult, MajorCycle, FiveElement } from '@/types'

const STEM_ELEMENT: Record<string, FiveElement> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
}

const ELEMENT_STYLES: Record<FiveElement, { bar: string; text: string }> = {
  木: { bar: '#4D7C0F', text: '#16a34a' },
  火: { bar: '#C2410C', text: '#C2410C' },
  土: { bar: '#92400E', text: '#B45309' },
  金: { bar: '#525252', text: '#525252' },
  水: { bar: '#1D4ED8', text: '#1D4ED8' },
}

const DEFAULT_STYLE = { bar: '#A8A29E', text: '#57534E' }

const TEN_GOD_FORTUNE: Record<string, { desc: string; fortune: 'auspicious' | 'mixed' | 'caution' }> = {
  比肩: { desc: '同路人相扶，自立自强运', fortune: 'mixed' },
  劫财: { desc: '财帛易散，宜守不宜进', fortune: 'caution' },
  食神: { desc: '天厨星护体，衣食丰足', fortune: 'auspicious' },
  伤官: { desc: '才华横溢，但须防官非', fortune: 'mixed' },
  正财: { desc: '稳进之财，婚姻顺遂', fortune: 'auspicious' },
  偏财: { desc: '横财偏禄，机遇迭出', fortune: 'auspicious' },
  正官: { desc: '仕途亨通，声誉日隆', fortune: 'auspicious' },
  七杀: { desc: '英雄运势，但须化煞', fortune: 'mixed' },
  正印: { desc: '贵人庇荫，文星高照', fortune: 'auspicious' },
  偏印: { desc: '异路功名，暗中相助', fortune: 'mixed' },
}

const FORTUNE_COLOR = {
  auspicious: '#16a34a',
  mixed: '#B45309',
  caution: '#BE123C',
}

function CycleCard({ cycle, isCurrent, delay }: {
  cycle: MajorCycle
  isCurrent: boolean
  delay: number
}) {
  const el = STEM_ELEMENT[cycle.stem] ?? '土'
  const styles = ELEMENT_STYLES[el] ?? DEFAULT_STYLE
  const fortuneInfo = TEN_GOD_FORTUNE[cycle.ten_god]
  const fortuneColor = fortuneInfo ? FORTUNE_COLOR[fortuneInfo.fortune] : 'var(--text-muted)'

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        position: 'relative', display: 'flex', gap: '16px',
        paddingBottom: '20px', opacity: isCurrent ? 1 : 0.65,
      }}
    >
      {/* 时间轴 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
          border: isCurrent ? '2px solid var(--blue)' : '2px solid var(--border-mid)',
          background: isCurrent ? 'var(--blue-light)' : 'transparent',
          boxShadow: isCurrent ? '0 0 8px rgba(74,111,165,0.4)' : 'none',
        }} />
        <div style={{ width: '1px', flex: 1, background: 'var(--border)', marginTop: '4px' }} />
      </div>

      {/* 卡片 */}
      <div
        className="card"
        style={{
          flex: 1, padding: '16px',
          borderLeft: isCurrent ? `3px solid var(--blue)` : '1px solid var(--border)',
          background: isCurrent ? 'var(--blue-light)' : 'var(--bg-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: styles.text }}>
              {cycle.stem}{cycle.branch}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>大运</span>
            {isCurrent && (
              <span style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                background: 'var(--blue-light)', color: 'var(--blue)',
                border: '1px solid var(--blue-mid)', fontWeight: 600,
              }}>
                当前
              </span>
            )}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {cycle.start_age} 岁起
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: styles.bar }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: fortuneColor }}>
            {cycle.ten_god}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{el}运</span>
        </div>

        {fortuneInfo && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {fortuneInfo.desc}
          </p>
        )}
      </div>
    </motion.div>
  )
}

interface Props {
  bazi: BaziResult
}

export function MajorCycleTimeline({ bazi }: Props) {
  const currentCycleIndex = Math.min(
    Math.floor(bazi.major_cycles.findIndex((c, i) => {
      const next = bazi.major_cycles[i + 1]
      return !next || c.start_age <= 30
    }) + Math.floor((new Date().getFullYear() - 2000) / 10)),
    bazi.major_cycles.length - 1
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card-lg" style={{ padding: '24px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600 }}>大运走势</span>
          <span>·</span>
          <span>每步大运约 10 年</span>
        </div>

        <div>
          {bazi.major_cycles.map((cycle, i) => (
            <CycleCard
              key={i}
              cycle={cycle}
              isCurrent={i === currentCycleIndex}
              delay={i * 0.07}
            />
          ))}
        </div>
      </div>

      <div style={{
        padding: '16px', borderRadius: '12px',
        background: 'var(--bg-subtle)', textAlign: 'center',
      }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          大运是人生阶段性运势的总纲，以十年为一步<br />
          配合流年（年运）可精确预测每年走势
        </p>
      </div>
    </div>
  )
}
