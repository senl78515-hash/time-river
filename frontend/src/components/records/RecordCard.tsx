'use client'

import { motion } from 'framer-motion'
import type { MemoryRecord } from '@/types'

const TYPE_CONFIG = {
  text: { icon: '📝', label: '文字', color: 'text-blue-300', bg: 'from-blue-900/30 to-indigo-900/30', border: 'border-blue-400/20' },
  image: { icon: '🖼', label: '图片', color: 'text-purple-300', bg: 'from-purple-900/30 to-indigo-900/30', border: 'border-purple-400/20' },
  video: { icon: '🎬', label: '视频', color: 'text-pink-300', bg: 'from-pink-900/30 to-rose-900/30', border: 'border-pink-400/20' },
  audio: { icon: '🎵', label: '音频', color: 'text-violet-300', bg: 'from-violet-900/30 to-purple-900/30', border: 'border-violet-400/20' },
  file: { icon: '📎', label: '文件', color: 'text-cyan-300', bg: 'from-cyan-900/30 to-blue-900/30', border: 'border-cyan-400/20' },
}

interface Props {
  record: MemoryRecord
  onDecrypt: (record: MemoryRecord) => void
}

export function RecordCard({ record, onDecrypt }: Props) {
  const config = TYPE_CONFIG[record.type]
  const date = new Date(record.created_at)
  const dateStr = date.toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
  const timeStr = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit', minute: '2-digit'
  })

  const isOnChain = record.solana_tx_hash && !record.solana_tx_hash.startsWith('mock_')

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`glass-card border bg-gradient-to-br ${config.bg} ${config.border} p-4 cursor-pointer group`}
      onClick={() => onDecrypt(record)}
    >
      {/* 顶部：类型 + 日期 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span className={`text-xs ${config.color}`}>{config.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {record.encrypted && (
            <span className="text-xs text-blue-300/40" title="已加密">🔒</span>
          )}
          {record.is_nft && (
            <span className="text-xs bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-400/30">
              NFT
            </span>
          )}
          {isOnChain && (
            <span className="text-xs text-green-400/60" title="已上链">⛓</span>
          )}
        </div>
      </div>

      {/* 标题 */}
      {record.title && (
        <h3 className="text-white/90 font-medium text-sm mb-2 line-clamp-1">{record.title}</h3>
      )}

      {/* 预览内容 */}
      <p className="text-blue-200/50 text-xs leading-relaxed line-clamp-3 mb-3">
        {record.encrypted && !record.decrypted_content
          ? '🔒 内容已加密，点击查看'
          : record.decrypted_content || record.preview
        }
      </p>

      {/* 底部：日期 + 链接 */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-blue-300/40 text-xs">{dateStr}</div>
          <div className="text-blue-300/25 text-xs">{timeStr}</div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className={`text-xs ${config.color}`}>查看详情 →</span>
        </div>
      </div>
    </motion.div>
  )
}
