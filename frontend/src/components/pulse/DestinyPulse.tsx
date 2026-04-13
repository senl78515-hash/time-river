'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import type { BaziResult, AstroChart } from '@/types'

interface DestinyPulseProps {
  bazi?: BaziResult
  astro?: AstroChart
  dailyMessage?: string
}

const TEN_GOD_STYLES: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  比肩: { color: '#3B6DBF', bg: '#EEF3FB', border: '#C5D8F0', icon: '⚖️' },
  劫财: { color: '#C0392B', bg: '#FEF2F2', border: '#FECACA', icon: '⚡' },
  食神: { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', icon: '✨' },
  伤官: { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: '🎭' },
  正财: { color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', icon: '💰' },
  偏财: { color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA', icon: '🎲' },
  正官: { color: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD', icon: '🏛️' },
  七杀: { color: '#BE123C', bg: '#FFF1F2', border: '#FECDD3', icon: '⚔️' },
  正印: { color: '#4338CA', bg: '#EEF2FF', border: '#C7D2FE', icon: '📖' },
  偏印: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: '🔮' },
}

const FIVE_ELEMENT_COLORS: Record<string, { bar: string; text: string }> = {
  木: { bar: '#4D7C0F', text: '#3F6212' },
  火: { bar: '#C2410C', text: '#9A3412' },
  土: { bar: '#92400E', text: '#78350F' },
  金: { bar: '#525252', text: '#404040' },
  水: { bar: '#1D4ED8', text: '#1E3A8A' },
}

export function DestinyPulse({ bazi, astro, dailyMessage }: DestinyPulseProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const tenGodStyle = bazi
    ? (TEN_GOD_STYLES[bazi.day_ten_god] || TEN_GOD_STYLES['比肩'])
    : null

  const totalScore = bazi
    ? Object.values(bazi.five_elements_score).reduce((a, b) => a + b, 0)
    : 0

  return (
    <motion.div
      style={{
        position: 'fixed',
        right: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 40,
        width: '228px',
      }}
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '16px',
          boxShadow: '0 4px 24px rgba(26,23,20,0.10)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <motion.div
              style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--gold)' }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
              天时脉搏
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                fontSize: '11px', color: 'var(--text-muted)', background: 'none',
                border: 'none', cursor: 'pointer', padding: '2px 6px',
                borderRadius: '6px', transition: 'background 0.15s',
              }}
            >
              {isExpanded ? '收' : '展'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              {bazi ? (
                <>
                  {/* 今日十神 */}
                  <div
                    style={{
                      borderRadius: '12px',
                      padding: '11px',
                      marginBottom: '12px',
                      background: tenGodStyle?.bg,
                      border: `1px solid ${tenGodStyle?.border}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ fontSize: '18px', marginTop: '1px' }}>{tenGodStyle?.icon}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: tenGodStyle?.color }}>
                            {bazi.day_ten_god}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>流日</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {bazi.day_ten_god_description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 五行气场 */}
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em' }}>
                      五行气场
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      {Object.entries(bazi.five_elements_score).map(([element, score]) => {
                        const el = FIVE_ELEMENT_COLORS[element] || { bar: '#888', text: '#555' }
                        const pct = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0
                        return (
                          <div key={element} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: el.text, width: '14px', fontWeight: 700 }}>
                              {element}
                            </span>
                            <div style={{ flex: 1, height: '5px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                              <motion.div
                                style={{ height: '100%', background: el.bar, borderRadius: '3px' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                              />
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '28px', textAlign: 'right' }}>
                              {pct}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <motion.div
                    style={{ fontSize: '26px', marginBottom: '10px' }}
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    ☯
                  </motion.div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.7 }}>
                    完成命理排盘后<br />天时脉搏将实时感知
                  </p>
                  <Link href="/destiny">
                    <button
                      className="btn-primary"
                      style={{ width: '100%', padding: '8px', fontSize: '13px' }}
                    >
                      ✦ 立即排盘
                    </button>
                  </Link>
                </div>
              )}

              {/* 星象动态 */}
              {astro && (astro.mercury_retrograde || astro.notable_transits.length > 0) && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>
                    天象动态
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {astro.mercury_retrograde && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px' }}>☿</span>
                        <span style={{ fontSize: '12px', color: '#B45309', fontWeight: 500 }}>水星逆行中</span>
                      </div>
                    )}
                    {astro.notable_transits.slice(0, 2).map((transit, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--gold)' }}>✦</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{transit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI 每日微语 */}
              {dailyMessage && (
                <div
                  style={{
                    borderRadius: '10px',
                    padding: '11px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>🌊</span>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {dailyMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* 无数据默认 */}
              {!bazi && !dailyMessage && (
                <div style={{ textAlign: 'center', paddingTop: '4px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>今日天时：平稳</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>宜沉心，宜记录</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
