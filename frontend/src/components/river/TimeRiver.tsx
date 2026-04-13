'use client'

import { useRef, useState, useCallback } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { MemoryBubble } from './MemoryBubble'
import { InspirationZone } from '@/components/inspiration/InspirationZone'
import type { MemoryRecord, BaziResult } from '@/types'

interface TimeRiverProps {
  records: MemoryRecord[]
  bazi?: BaziResult
  onAddRecord: () => void
  onRecordDecrypt: (record: MemoryRecord) => void
}

// 生成气泡在河流中的位置（Y轴分布在河流区域）
function generateBubblePosition(index: number, total: number) {
  const lanes = 3  // 三条水道
  const lane = index % lanes
  const yPositions = [28, 42, 56]  // 三个垂直位置（百分比）
  const yOffset = (Math.random() - 0.5) * 8
  return {
    y: yPositions[lane] + yOffset,
    size: 80 + Math.random() * 60,   // 气泡大小 80-140px
    delay: index * 0.1,
  }
}

export function TimeRiver({ records, bazi, onAddRecord, onRecordDecrypt }: TimeRiverProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedRecord, setSelectedRecord] = useState<MemoryRecord | null>(null)

  // 水平滚动视差
  const { scrollXProgress } = useScroll({ container: containerRef })

  // 三层波浪视差速率不同（营造3D深度感）
  const wave1X = useTransform(scrollXProgress, [0, 1], [0, -60])
  const wave2X = useTransform(scrollXProgress, [0, 1], [0, -40])
  const wave3X = useTransform(scrollXProgress, [0, 1], [0, -20])
  const starsX = useTransform(scrollXProgress, [0, 1], [0, -80])

  // 气泡视差（不同速率，营造深度）
  const bubble1X = useTransform(scrollXProgress, [0, 1], [0, -120])
  const bubble2X = useTransform(scrollXProgress, [0, 1], [0, -90])
  const bubble3X = useTransform(scrollXProgress, [0, 1], [0, -70])

  const handleBubbleClick = useCallback((record: MemoryRecord, e: React.MouseEvent) => {
    // 涟漪特效
    const ripple = document.createElement('div')
    ripple.className = 'ripple'
    ripple.style.cssText = `
      width: 20px; height: 20px;
      left: ${e.clientX - 10}px; top: ${e.clientY - 10}px;
      position: fixed; z-index: 9999;
    `
    document.body.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)

    setSelectedRecord(record)
    onRecordDecrypt(record)
  }, [onRecordDecrypt])

  // 计算内容总宽度（基于记录数量，使用安全的 window 访问）
  const contentWidth = Math.max(
    records.length * 200 + 400,
    (typeof window !== 'undefined' ? window.innerWidth : 1920) * 2
  )

  // 按时间排序，左(过去)→右(未来)
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return (
    <div className="relative w-full h-full overflow-hidden">

      {/* ── 星空背景层 ── */}
      <motion.div
        className="starfield absolute inset-0"
        style={{ x: starsX }}
      >
        <StarField />
      </motion.div>

      {/* ── 时间标尺（顶部）── */}
      <TimelineRuler records={sortedRecords} containerRef={containerRef} />

      {/* ── 主滚动容器（水平）── */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-x-auto overflow-y-hidden"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(96, 165, 250, 0.3) transparent',
        }}
      >
        <div
          className="relative h-full"
          style={{ width: `${contentWidth}px`, minWidth: '100vw' }}
        >

          {/* ── 记录灵感区域（左侧固定可见）── */}
          <InspirationZone bazi={bazi} onAddRecord={onAddRecord} />

          {/* ── 时间节点标记 ── */}
          <TimelineMarkers records={sortedRecords} />

          {/* ── 记忆气泡（随时间流动）── */}
          <div className="absolute inset-0" style={{ top: '15%', height: '55%' }}>
            {sortedRecords.map((record, i) => {
              const pos = generateBubblePosition(i, sortedRecords.length)
              const xBase = 120 + i * 200
              const parallaXTransform = i % 3 === 0 ? bubble1X : i % 3 === 1 ? bubble2X : bubble3X

              return (
                <motion.div
                  key={record.id}
                  className="absolute"
                  style={{
                    left: xBase,
                    top: `${pos.y}%`,
                    x: parallaXTransform,
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: pos.delay, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <MemoryBubble
                    record={record}
                    size={pos.size}
                    onClick={(e) => handleBubbleClick(record, e)}
                  />
                </motion.div>
              )
            })}

            {/* 空状态提示 */}
            {records.length === 0 && (
              <EmptyRiverState onAddRecord={onAddRecord} />
            )}
          </div>

          {/* ── 三层视差波浪 ── */}
          <div className="wave-container">
            <motion.div className="wave wave-1" style={{ x: wave1X }} />
            <motion.div className="wave wave-2" style={{ x: wave2X }} />
            <motion.div className="wave wave-3" style={{ x: wave3X }} />
            <div className="river-reflection" />
          </div>

        </div>
      </div>

      {/* ── 添加记录按钮（右下角）── */}
      <motion.button
        className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full
                   bg-gradient-to-br from-blue-600 to-blue-700
                   border border-blue-400/30 shadow-lg shadow-blue-900/50
                   flex items-center justify-center text-2xl
                   hover:scale-110 active:scale-95 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAddRecord}
        title="记录新时光"
      >
        +
      </motion.button>

      {/* ── 左侧"过去"渐变遮罩 ── */}
      <div
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 z-10"
        style={{
          background: 'linear-gradient(to right, rgba(2,11,24,0.8), transparent)',
        }}
      />

      {/* ── 右侧"未来"渐变遮罩 ── */}
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 z-10"
        style={{
          background: 'linear-gradient(to left, rgba(2,11,24,0.8), transparent)',
        }}
      />
    </div>
  )
}

// ── 星空背景组件 ──────────────────────────────────────────────
function StarField() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 60,
    size: Math.random() * 2 + 0.5,
    duration: 2 + Math.random() * 4,
    delay: Math.random() * 4,
    minOpacity: 0.1 + Math.random() * 0.2,
    maxOpacity: 0.5 + Math.random() * 0.5,
  }))

  return (
    <>
      {stars.map(star => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [star.minOpacity, star.maxOpacity, star.minOpacity],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  )
}

// ── 时间标尺 ──────────────────────────────────────────────────
function TimelineRuler({
  records,
  containerRef,
}: {
  records: MemoryRecord[]
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  if (records.length === 0) return null

  const dates = records.map(r => new Date(r.created_at))
  const months: string[] = []
  dates.forEach(d => {
    const label = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!months.includes(label)) months.push(label)
  })

  return (
    <div className="absolute top-4 left-0 right-0 z-20 flex items-center px-8">
      <div className="text-xs text-blue-300/40 mr-4">← 过去</div>
      <div className="flex gap-4 overflow-hidden">
        {months.map(m => (
          <div key={m} className="text-xs text-blue-300/30 whitespace-nowrap">{m}</div>
        ))}
      </div>
      <div className="text-xs text-blue-300/40 ml-4">未来 →</div>
    </div>
  )
}

// ── 时间节点标记 ──────────────────────────────────────────────
function TimelineMarkers({ records }: { records: MemoryRecord[] }) {
  return (
    <div className="absolute" style={{ top: '68%', left: 0, right: 0 }}>
      {/* 时间线主轴 */}
      <div
        className="absolute h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent"
        style={{ left: 80, right: 80, top: 0 }}
      />
      {/* 各记录节点 */}
      {records.map((record, i) => (
        <div
          key={record.id}
          className="absolute flex flex-col items-center"
          style={{ left: 120 + i * 200, transform: 'translateX(-50%)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400/40" />
          <div className="text-xs text-blue-300/30 mt-1 whitespace-nowrap">
            {new Date(record.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── 空状态 ────────────────────────────────────────────────────
function EmptyRiverState({ onAddRecord }: { onAddRecord: () => void }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <motion.div
        className="text-6xl mb-4"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        🌊
      </motion.div>
      <p className="text-blue-200/50 text-lg mb-2">你的时光之河尚未开始流淌</p>
      <p className="text-blue-300/30 text-sm mb-6">每一滴记录，都将成为永恒</p>
      <button
        onClick={onAddRecord}
        className="btn-primary px-6 py-3 text-sm"
      >
        滴入第一滴时光
      </button>
    </motion.div>
  )
}
