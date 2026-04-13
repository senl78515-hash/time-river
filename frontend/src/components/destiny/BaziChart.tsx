'use client'

import { motion } from 'framer-motion'
import type { BaziResult, Pillar, FiveElement, DestinyInput } from '@/types'

const ELEMENT_STYLES: Record<FiveElement, { bg: string; border: string; text: string; bar: string }> = {
  木: { bg: '#F0FDF4', border: '#BBF7D0', text: '#16a34a', bar: '#4D7C0F' },
  火: { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C', bar: '#C2410C' },
  土: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', bar: '#92400E' },
  金: { bg: '#F4F4F5', border: '#E4E4E7', text: '#525252', bar: '#525252' },
  水: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', bar: '#1D4ED8' },
}

const STEM_ELEMENT: Record<string, FiveElement> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
}

const BRANCH_ELEMENT: Record<string, FiveElement> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
}

const DEFAULT_STYLE = { bg: '#F5F0E8', border: '#E7E5E4', text: '#57534E', bar: '#A8A29E' }

function PillarCard({ pillar, label, delay }: { pillar: Pillar; label: string; delay: number }) {
  const stemEl = STEM_ELEMENT[pillar.stem] ?? '土'
  const branchEl = BRANCH_ELEMENT[pillar.branch] ?? '土'
  const stemS = ELEMENT_STYLES[stemEl] ?? DEFAULT_STYLE
  const branchS = ELEMENT_STYLES[branchEl] ?? DEFAULT_STYLE

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
    >
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>

      {/* 天干 */}
      <div style={{
        width: '64px', height: '64px', borderRadius: '14px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: stemS.bg, border: `1px solid ${stemS.border}`,
      }}>
        <span style={{ fontSize: '24px', fontWeight: 700, color: stemS.text }}>{pillar.stem}</span>
        {pillar.stem_ten_god && (
          <span style={{ fontSize: '10px', color: stemS.text, opacity: 0.7, marginTop: '2px' }}>
            {pillar.stem_ten_god}
          </span>
        )}
      </div>

      {/* 地支 */}
      <div style={{
        width: '64px', height: '64px', borderRadius: '14px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: branchS.bg, border: `1px solid ${branchS.border}`,
      }}>
        <span style={{ fontSize: '24px', fontWeight: 700, color: branchS.text }}>{pillar.branch}</span>
        {pillar.branch_ten_god && (
          <span style={{ fontSize: '10px', color: branchS.text, opacity: 0.7, marginTop: '2px' }}>
            {pillar.branch_ten_god}
          </span>
        )}
      </div>

      {/* 藏干 */}
      {pillar.hidden_stems && pillar.hidden_stems.length > 0 && (
        <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
          {pillar.hidden_stems.map((s, i) => {
            const el = STEM_ELEMENT[s] ?? '土'
            const c = ELEMENT_STYLES[el] ?? DEFAULT_STYLE
            return (
              <span key={i} style={{ fontSize: '11px', color: c.text, opacity: 0.7 }}>{s}</span>
            )
          })}
        </div>
      )}

      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
        {stemEl} · {branchEl}
      </div>
    </motion.div>
  )
}

interface Props {
  bazi: BaziResult
  form?: DestinyInput
}

export function BaziChart({ bazi, form }: Props) {
  const pillars = [
    { pillar: bazi.year_pillar, label: '年柱', delay: 0.1 },
    { pillar: bazi.month_pillar, label: '月柱', delay: 0.2 },
    { pillar: bazi.day_pillar, label: '日柱', delay: 0.3 },
    { pillar: bazi.hour_pillar, label: '时柱', delay: 0.4 },
  ]

  const maxScore = Math.max(...Object.values(bazi.five_elements_score), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 四柱 */}
      <div className="card-lg" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span>四柱排盘</span>
          <span>·</span>
          <span>日主：{bazi.day_master_label}</span>
          {form?.birth_date && (
            <>
              <span>·</span>
              <span>流年：{bazi.current_year_stem}{bazi.current_year_branch}年</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start' }}>
          {pillars.map(({ pillar, label, delay }) => (
            <PillarCard key={label} pillar={pillar} label={label} delay={delay} />
          ))}
        </div>
      </div>

      {/* 五行力量 */}
      <div className="card-lg" style={{ padding: '24px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 600 }}>
          五行力量分布
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(Object.entries(bazi.five_elements_score) as [FiveElement, number][]).map(([element, score]) => {
            const s = ELEMENT_STYLES[element] ?? DEFAULT_STYLE
            const isFavorable = bazi.favorable_elements.includes(element)
            const isUnfavorable = bazi.unfavorable_elements.includes(element)
            const pct = Math.round((score / maxScore) * 100)

            return (
              <div key={element} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: s.text, width: '16px' }}>{element}</span>
                <div style={{ flex: 1, height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', background: s.bar, borderRadius: '4px' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '32px', textAlign: 'right' }}>{score}分</span>
                {isFavorable && <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>喜</span>}
                {isUnfavorable && <span style={{ fontSize: '11px', color: '#BE123C', fontWeight: 600 }}>忌</span>}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: '16px', display: 'flex', gap: '20px', fontSize: '13px' }}>
          <div>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>喜用神：</span>
            <span style={{ color: 'var(--text-secondary)' }}>{bazi.favorable_elements.join('、')}</span>
          </div>
          <div>
            <span style={{ color: '#BE123C', fontWeight: 600 }}>忌神：</span>
            <span style={{ color: 'var(--text-secondary)' }}>{bazi.unfavorable_elements.join('、')}</span>
          </div>
        </div>
      </div>

      {/* 今日天时 */}
      <div className="card-lg" style={{ padding: '20px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600 }}>
          今日天时
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'var(--gold-light)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: 'var(--gold)',
          }}>
            {bazi.day_ten_god}
          </div>
          <div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {bazi.day_ten_god_description}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              流年 {bazi.current_year_stem}{bazi.current_year_branch} · 今日{bazi.day_ten_god}当令
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
