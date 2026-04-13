'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MemoryRecord } from '@/types'

interface MemoryBubbleProps {
  record: MemoryRecord
  size: number
  onClick: (e: React.MouseEvent) => void
}

// 根据记录类型返回图标和颜色
function getTypeStyle(type: MemoryRecord['type']) {
  const styles = {
    text:  { icon: '✍️', gradient: 'from-blue-600/80 to-blue-900/80', glow: 'rgba(59, 130, 246, 0.4)' },
    image: { icon: '🖼️', gradient: 'from-indigo-600/80 to-purple-900/80', glow: 'rgba(99, 102, 241, 0.4)' },
    video: { icon: '🎬', gradient: 'from-pink-600/80 to-rose-900/80', glow: 'rgba(236, 72, 153, 0.4)' },
    audio: { icon: '🎵', gradient: 'from-violet-600/80 to-purple-900/80', glow: 'rgba(139, 92, 246, 0.4)' },
    file:  { icon: '📎', gradient: 'from-cyan-600/80 to-teal-900/80', glow: 'rgba(20, 184, 166, 0.4)' },
  }
  return styles[type] || styles.text
}

export function MemoryBubble({ record, size, onClick }: MemoryBubbleProps) {
  const [isHovered, setIsHovered] = useState(false)
  const style = getTypeStyle(record.type)

  const previewText = record.type === 'text'
    ? record.preview.substring(0, 40) + (record.preview.length > 40 ? '…' : '')
    : style.icon

  return (
    <motion.div
      className="relative cursor-pointer select-none"
      style={{ width: size, height: size }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ scale: 1.08, y: -4 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* 外光环 */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${style.glow} 0%, transparent 70%)`,
          scale: 1.3,
        }}
        animate={{ opacity: isHovered ? 1 : 0.4 }}
        transition={{ duration: 0.3 }}
      />

      {/* 旋转边框 */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, transparent, ${style.glow}, transparent)`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* 气泡主体 */}
      <div
        className={`absolute inset-1 rounded-full bg-gradient-to-br ${style.gradient}
                    backdrop-blur-sm flex flex-col items-center justify-center
                    border border-white/10`}
      >
        {/* 记录类型图标（小型气泡） */}
        {size < 100 ? (
          <span className="text-xl">{style.icon}</span>
        ) : (
          <>
            {/* 大型气泡：显示内容预览 */}
            {record.type === 'text' ? (
              <p className="text-white/80 text-xs text-center px-3 leading-relaxed">
                {previewText}
              </p>
            ) : (
              <span className="text-2xl mb-1">{style.icon}</span>
            )}
            {/* 时间标签 */}
            <span className="text-white/30 text-xs mt-1">
              {new Date(record.created_at).toLocaleDateString('zh-CN', {
                month: 'short', day: 'numeric',
              })}
            </span>
          </>
        )}

        {/* 加密锁图标 */}
        {record.encrypted && (
          <div className="absolute top-2 right-2 text-xs text-white/40">🔒</div>
        )}

        {/* NFT 标签 */}
        {record.is_nft && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2
                          text-xs bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-full
                          border border-amber-400/30">
            NFT
          </div>
        )}
      </div>

      {/* Hover 时显示完整预览 Tooltip */}
      <AnimatePresence>
        {isHovered && size >= 100 && (
          <motion.div
            className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full
                       glass-card p-3 min-w-48 max-w-64 z-50 pointer-events-none"
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-blue-100 text-xs leading-relaxed">
              {record.type === 'text' ? record.preview.substring(0, 80) : `${style.icon} 点击解密查看`}
            </p>
            <p className="text-blue-300/40 text-xs mt-1">
              {new Date(record.created_at).toLocaleString('zh-CN')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
