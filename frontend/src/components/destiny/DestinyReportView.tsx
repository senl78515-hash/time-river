'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DestinyReport, DestinyDimension } from '@/types'

const DIMENSION_META: Record<string, { icon: string; color: string; border: string; bg: string }> = {
  personality: { icon: '🌟', color: '#4338CA', border: '#C7D2FE', bg: '#EEF2FF' },
  career:      { icon: '⚡', color: '#B45309', border: '#FDE68A', bg: '#FFFBEB' },
  marriage:    { icon: '💫', color: '#BE123C', border: '#FECDD3', bg: '#FFF1F2' },
  wealth:      { icon: '✨', color: '#B8860B', border: '#FDE68A', bg: '#FFFBEB' },
  children:    { icon: '🌱', color: '#16a34a', border: '#BBF7D0', bg: '#F0FDF4' },
  health:      { icon: '🌊', color: '#0369A1', border: '#BAE6FD', bg: '#F0F9FF' },
  family:      { icon: '🏔', color: '#7C3AED', border: '#DDD6FE', bg: '#F5F3FF' },
}

const DEFAULT_META = { icon: '📖', color: '#4A6FA5', border: '#C5D8F0', bg: '#EEF3FB' }

function DimensionCard({
  dimension,
  index,
  onFeedback,
}: {
  dimension: DestinyDimension
  index: number
  onFeedback: (key: string, feedback: 'accurate' | 'inaccurate') => void
}) {
  const [expanded, setExpanded] = useState(index === 0)
  const meta = DIMENSION_META[dimension.key] ?? DEFAULT_META

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="card"
      style={{ overflow: 'hidden', borderLeft: `4px solid ${meta.border}` }}
    >
      {/* 标题行 */}
      <button
        style={{
          width: '100%', padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: meta.bg, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '18px', flexShrink: 0,
          }}>
            {meta.icon}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {dimension.label}
            </div>
            {!expanded && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {dimension.content.slice(0, 44)}...
              </div>
            )}
          </div>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 20px 20px' }}>
              {/* 经典口诀 */}
              <div style={{
                padding: '10px 14px', marginBottom: '14px', borderRadius: '10px',
                background: meta.bg, borderLeft: `3px solid ${meta.color}`,
              }}>
                <p style={{ fontSize: '13px', color: meta.color, fontStyle: 'italic', lineHeight: 1.7 }}>
                  「{dimension.classic_quote}」
                </p>
              </div>

              {/* AI 解读 */}
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {dimension.content}
              </p>

              {/* 反馈 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>这段解读：</span>
                <button
                  onClick={() => onFeedback(dimension.key, 'accurate')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '4px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px',
                    border: dimension.feedback === 'accurate' ? '1px solid #BBF7D0' : '1px solid var(--border)',
                    background: dimension.feedback === 'accurate' ? '#F0FDF4' : 'var(--bg-card)',
                    color: dimension.feedback === 'accurate' ? '#16a34a' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  👍 准确
                </button>
                <button
                  onClick={() => onFeedback(dimension.key, 'inaccurate')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '4px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px',
                    border: dimension.feedback === 'inaccurate' ? '1px solid #FECDD3' : '1px solid var(--border)',
                    background: dimension.feedback === 'inaccurate' ? '#FFF1F2' : 'var(--bg-card)',
                    color: dimension.feedback === 'inaccurate' ? '#BE123C' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  👎 不准
                </button>
                {dimension.feedback && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    已记录，感谢反馈
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface Props {
  report: DestinyReport
  onFeedback: (dimensionKey: string, feedback: 'accurate' | 'inaccurate') => void
}

export function DestinyReportView({ report, onFeedback }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {report.dimensions.map((dim, i) => (
        <DimensionCard
          key={dim.key}
          dimension={dim}
          index={i}
          onFeedback={onFeedback}
        />
      ))}

      <div style={{ textAlign: 'center', paddingTop: '16px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          本命书由 AI 参阅千年命理典籍生成，仅供参考<br />
          Time River · 时光流 — 让每一刻都成为永恒
        </p>
      </div>
    </div>
  )
}
