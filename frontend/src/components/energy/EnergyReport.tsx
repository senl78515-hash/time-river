'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BaziResult } from '@/types'

type Period = 'day' | 'week' | 'month' | 'year'

interface EnergyDimension {
  key: string
  label: string
  score: number
  desc: string
  color: string
}

interface EnergyReportData {
  period: Period
  title: string
  overall_energy: number
  overall_desc: string
  dimensions: EnergyDimension[]
  auspicious_hours: string
  auspicious_direction: string
  lucky_color: string
  avoid: string
  affirmation: string
  ai_message: string
}

const PERIOD_LABELS: Record<Period, string> = {
  day: '日', week: '周', month: '月', year: '年',
}

// ── Canvas 长图生成 ───────────────────────────────────────────
function generateEnergyCanvas(report: EnergyReportData, canvasEl: HTMLCanvasElement) {
  const width = 750
  const height = 1200
  canvasEl.width = width
  canvasEl.height = height
  const ctx = canvasEl.getContext('2d')!

  // 背景渐变
  const bg = ctx.createLinearGradient(0, 0, 0, height)
  bg.addColorStop(0, '#020b18')
  bg.addColorStop(0.5, '#040f1f')
  bg.addColorStop(1, '#020b18')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  // 星点背景
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * width
    const y = Math.random() * height * 0.6
    const r = Math.random() * 1.5 + 0.3
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // 顶部装饰波浪
  const waveGrad = ctx.createLinearGradient(0, 0, width, 0)
  waveGrad.addColorStop(0, 'rgba(96,165,250,0)')
  waveGrad.addColorStop(0.5, 'rgba(96,165,250,0.15)')
  waveGrad.addColorStop(1, 'rgba(96,165,250,0)')
  ctx.fillStyle = waveGrad
  ctx.fillRect(0, 80, width, 2)

  // 品牌 Logo
  ctx.font = '600 14px sans-serif'
  ctx.fillStyle = 'rgba(96,165,250,0.6)'
  ctx.textAlign = 'center'
  ctx.fillText('🌊 Time River · 时光流', width / 2, 50)

  // 日期
  const dateStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
  ctx.font = '12px sans-serif'
  ctx.fillStyle = 'rgba(147,197,253,0.4)'
  ctx.fillText(dateStr, width / 2, 70)

  // 标题
  ctx.font = 'bold 26px sans-serif'
  ctx.fillStyle = '#e2e8f0'
  ctx.textAlign = 'center'
  ctx.fillText(report.title, width / 2, 130)

  // 总能量圆形
  const cx = width / 2
  const cy = 230
  const radius = 80

  // 圆弧背景
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(96,165,250,0.1)'
  ctx.lineWidth = 12
  ctx.stroke()

  // 能量进度弧
  const energyAngle = (report.overall_energy / 100) * Math.PI * 2
  ctx.beginPath()
  ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + energyAngle)
  ctx.strokeStyle = energyColor(report.overall_energy)
  ctx.lineWidth = 12
  ctx.lineCap = 'round'
  ctx.stroke()

  // 能量值文字
  ctx.font = 'bold 36px sans-serif'
  ctx.fillStyle = energyColor(report.overall_energy)
  ctx.textAlign = 'center'
  ctx.fillText(String(report.overall_energy), cx, cy + 12)

  ctx.font = '12px sans-serif'
  ctx.fillStyle = 'rgba(147,197,253,0.6)'
  ctx.fillText(report.overall_desc, cx, cy + 32)

  // 分割线
  drawDivider(ctx, width, 320)

  // 五维雷达（简化为水平条形图）
  let yPos = 350
  ctx.font = 'bold 13px sans-serif'
  ctx.fillStyle = 'rgba(147,197,253,0.6)'
  ctx.textAlign = 'left'
  ctx.fillText('五维能量分布', 60, yPos)
  yPos += 20

  report.dimensions.forEach(dim => {
    yPos += 8
    ctx.font = '13px sans-serif'
    ctx.fillStyle = 'rgba(226,232,240,0.8)'
    ctx.textAlign = 'left'
    ctx.fillText(dim.label, 60, yPos + 12)

    // 背景条
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.beginPath()
    ctx.roundRect(140, yPos, 460, 16, 8)
    ctx.fill()

    // 能量条
    const barWidth = (dim.score / 100) * 460
    const barGrad = ctx.createLinearGradient(140, 0, 140 + barWidth, 0)
    barGrad.addColorStop(0, dim.color + '88')
    barGrad.addColorStop(1, dim.color)
    ctx.fillStyle = barGrad
    ctx.beginPath()
    ctx.roundRect(140, yPos, barWidth, 16, 8)
    ctx.fill()

    // 分数
    ctx.font = '11px sans-serif'
    ctx.fillStyle = dim.color
    ctx.textAlign = 'left'
    ctx.fillText(dim.desc, 615, yPos + 12)

    yPos += 32
  })

  // 分割线
  drawDivider(ctx, width, yPos + 10)
  yPos += 30

  // 吉时 + 方位 + 颜色
  const infoItems = [
    { label: '吉时', value: report.auspicious_hours, icon: '⏰' },
    { label: '吉位', value: report.auspicious_direction, icon: '🧭' },
    { label: '幸运色', value: report.lucky_color, icon: '🎨' },
  ]
  infoItems.forEach((item, i) => {
    const x = 60 + i * 210
    ctx.font = '20px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(item.icon, x, yPos + 10)
    ctx.font = '11px sans-serif'
    ctx.fillStyle = 'rgba(147,197,253,0.5)'
    ctx.fillText(item.label, x + 28, yPos)
    ctx.font = '13px sans-serif'
    ctx.fillStyle = 'rgba(226,232,240,0.9)'
    ctx.fillText(item.value, x + 28, yPos + 16)
  })

  yPos += 50

  // 宜忌
  ctx.font = '12px sans-serif'
  ctx.fillStyle = 'rgba(147,197,253,0.4)'
  ctx.textAlign = 'left'
  ctx.fillText('📋 宜忌', 60, yPos)
  ctx.font = '13px sans-serif'
  ctx.fillStyle = 'rgba(226,232,240,0.7)'
  ctx.fillText(report.avoid, 100, yPos)
  yPos += 40

  // 分割线
  drawDivider(ctx, width, yPos)
  yPos += 30

  // 能量宣言
  ctx.font = 'bold 16px sans-serif'
  ctx.fillStyle = 'rgba(251,191,36,0.9)'
  ctx.textAlign = 'center'
  ctx.fillText(`「${report.affirmation}」`, width / 2, yPos + 16)
  yPos += 50

  // AI 温情微语卡片
  ctx.fillStyle = 'rgba(96,165,250,0.06)'
  ctx.beginPath()
  ctx.roundRect(40, yPos, width - 80, 80, 16)
  ctx.fill()
  ctx.strokeStyle = 'rgba(96,165,250,0.15)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.font = '13px sans-serif'
  ctx.fillStyle = 'rgba(147,197,253,0.8)'
  ctx.textAlign = 'center'
  wrapText(ctx, report.ai_message, width / 2, yPos + 35, width - 120, 20)

  yPos += 100

  // 底部版权
  ctx.font = '11px sans-serif'
  ctx.fillStyle = 'rgba(96,165,250,0.2)'
  ctx.textAlign = 'center'
  ctx.fillText('Time River · 时光流 — 让每一刻都成为永恒', width / 2, height - 40)
  ctx.fillText('此报告由 AI 命理引擎生成，仅供参考', width / 2, height - 20)
}

function drawDivider(ctx: CanvasRenderingContext2D, width: number, y: number) {
  const grad = ctx.createLinearGradient(0, 0, width, 0)
  grad.addColorStop(0, 'transparent')
  grad.addColorStop(0.5, 'rgba(96,165,250,0.15)')
  grad.addColorStop(1, 'transparent')
  ctx.fillStyle = grad
  ctx.fillRect(40, y, width - 80, 1)
}

function energyColor(score: number): string {
  if (score >= 80) return '#4ade80'
  if (score >= 60) return '#60a5fa'
  if (score >= 40) return '#fbbf24'
  return '#f87171'
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const chars = text.split('')
  let line = ''
  let currentY = y

  for (const char of chars) {
    const testLine = line + char
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line, x, currentY)
      line = char
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, currentY)
}

// ── 主组件 ───────────────────────────────────────────────────

interface Props {
  bazi: BaziResult
  onClose: () => void
}

export function EnergyReport({ bazi, onClose }: Props) {
  const [period, setPeriod] = useState<Period>('day')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<EnergyReportData | null>(null)
  const [sharing, setSharing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const fetchReport = useCallback(async (p: Period) => {
    setLoading(true)
    setPeriod(p)
    setReport(null)
    try {
      const res = await fetch('/api/energy/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bazi, period: p }),
      })
      if (!res.ok) throw new Error('生成失败')
      const data = await res.json()
      setReport(data.report)
    } catch {
      alert('能量报告生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [bazi])

  const handleShare = useCallback(() => {
    if (!report || !canvasRef.current) return
    setSharing(true)
    try {
      generateEnergyCanvas(report, canvasRef.current)
      const dataUrl = canvasRef.current.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `time-river-${period}-energy-${Date.now()}.png`
      a.click()
    } finally {
      setSharing(false)
    }
  }, [report, period])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <motion.div
        className="relative glass-card border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="p-6">
          {/* 标题 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-medium">能量报告</h2>
            <button onClick={onClose} className="text-blue-300/40 hover:text-blue-300/80 text-xl">✕</button>
          </div>

          {/* 周期选择 */}
          <div className="flex gap-2 mb-6">
            {(['day', 'week', 'month', 'year'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => fetchReport(p)}
                className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                  period === p && report
                    ? 'bg-blue-500/30 text-blue-200 border border-blue-400/40'
                    : 'border border-white/10 text-blue-300/50 hover:border-white/20'
                }`}
              >
                本{PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          {/* 初始状态 */}
          {!report && !loading && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">⚡</div>
              <p className="text-blue-200/60 mb-2">选择周期，生成你的能量报告</p>
              <p className="text-blue-300/30 text-sm">融合八字天时 · AI 深度分析</p>
            </div>
          )}

          {/* 加载状态 */}
          {loading && (
            <div className="text-center py-12">
              <motion.div
                className="text-4xl mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                ☯
              </motion.div>
              <p className="text-blue-200/70">AI 命师推演中...</p>
              <div className="loading-dots mt-4"><span /><span /><span /></div>
            </div>
          )}

          {/* 报告展示 */}
          {report && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              {/* 总能量 */}
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(96,165,250,0.1)" strokeWidth="10" />
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke={energyColor(report.overall_energy)}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${report.overall_energy * 2.64} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold" style={{ color: energyColor(report.overall_energy) }}>
                      {report.overall_energy}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-white text-lg font-medium mb-1">{report.title}</h3>
                  <p className="text-blue-200/60 text-sm">{report.overall_desc}</p>
                  <div className="flex gap-3 mt-2 text-xs text-blue-300/40">
                    <span>⏰ {report.auspicious_hours}</span>
                    <span>🧭 {report.auspicious_direction}</span>
                  </div>
                </div>
              </div>

              {/* 五维 */}
              <div className="space-y-2.5">
                {report.dimensions.map(dim => (
                  <div key={dim.key} className="flex items-center gap-3">
                    <span className="text-blue-200/70 text-sm w-8 flex-shrink-0">{dim.label}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: dim.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${dim.score}%` }}
                        transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-xs w-20 text-right flex-shrink-0" style={{ color: dim.color }}>
                      {dim.desc}
                    </span>
                  </div>
                ))}
              </div>

              {/* 幸运 */}
              <div className="glass-card p-3 flex gap-4 text-sm">
                <div>
                  <span className="text-blue-300/40 text-xs">幸运色</span>
                  <div className="text-blue-200/80">{report.lucky_color}</div>
                </div>
                <div className="border-l border-white/5 pl-4">
                  <span className="text-blue-300/40 text-xs">宜忌</span>
                  <div className="text-blue-200/70">{report.avoid}</div>
                </div>
              </div>

              {/* 宣言 */}
              <div className="text-center py-3 border border-amber-400/20 rounded-xl bg-amber-400/5">
                <p className="text-amber-300 font-medium">「{report.affirmation}」</p>
              </div>

              {/* AI 微语 */}
              <div className="glass-card p-4">
                <p className="text-blue-200/70 text-sm leading-relaxed">{report.ai_message}</p>
              </div>

              {/* 分享按钮 */}
              <button
                onClick={handleShare}
                disabled={sharing}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                <span>📷</span>
                <span>{sharing ? '生成中...' : '保存为长图分享'}</span>
              </button>
            </motion.div>
          )}

          {/* 隐藏的 Canvas */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </motion.div>
    </motion.div>
  )
}
