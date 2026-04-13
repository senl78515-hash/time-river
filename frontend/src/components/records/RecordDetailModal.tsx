'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  getCachedKey, setCachedKey,
  deriveEncryptionKey, decryptToString
} from '@/lib/crypto/encryption'
import { fetchFromArweave } from '@/lib/storage/irys'
import type { MemoryRecord } from '@/types'

interface Props {
  record: MemoryRecord
  onClose: () => void
}

export function RecordDetailModal({ record, onClose }: Props) {
  const { signMessage, publicKey } = useWallet()
  const [content, setContent] = useState<string | null>(record.decrypted_content ?? null)
  const [decrypting, setDecrypting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [arweaveData, setArweaveData] = useState<string | null>(null)
  const [loadingArweave, setLoadingArweave] = useState(false)

  const config = {
    text: { icon: '📝', label: '文字记录' },
    image: { icon: '🖼', label: '图片记录' },
    video: { icon: '🎬', label: '视频记录' },
    audio: { icon: '🎵', label: '音频记录' },
    file: { icon: '📎', label: '文件记录' },
  }[record.type]

  const handleDecrypt = useCallback(async () => {
    if (!signMessage || !publicKey) {
      setError('请先连接钱包')
      return
    }
    setDecrypting(true)
    setError(null)
    try {
      // 获取加密密钥
      const walletAddr = publicKey.toString()
      let key = getCachedKey(walletAddr)
      if (!key) {
        key = await deriveEncryptionKey(signMessage, walletAddr)
        setCachedKey(walletAddr, key)
      }

      // 从 Arweave 获取加密内容
      const payload = await fetchFromArweave(record.arweave_cid)
      if (!payload) {
        setError('无法从 Arweave 获取内容，请稍后重试')
        return
      }

      const decrypted = await decryptToString(payload, key)
      setContent(decrypted)
    } catch (err) {
      setError(err instanceof Error ? err.message : '解密失败')
    } finally {
      setDecrypting(false)
    }
  }, [signMessage, publicKey, record.arweave_cid])

  const handleFetchArweave = useCallback(async () => {
    if (!record.arweave_cid) return
    setLoadingArweave(true)
    try {
      const payload = await fetchFromArweave(record.arweave_cid)
      setArweaveData(payload ? JSON.stringify(payload, null, 2) : '获取失败')
    } catch {
      setArweaveData('请求失败')
    } finally {
      setLoadingArweave(false)
    }
  }, [record.arweave_cid])

  // 如果已有解密内容直接展示
  useEffect(() => {
    if (record.decrypted_content) {
      setContent(record.decrypted_content)
    }
  }, [record.decrypted_content])

  const date = new Date(record.created_at)
  const isOnChain = record.solana_tx_hash && !record.solana_tx_hash.startsWith('mock_')

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <motion.div
        className="relative glass-card border border-white/10 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* 顶部 */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h2 className="text-white/90 font-medium">
                {record.title || config.label}
              </h2>
              <p className="text-blue-300/40 text-xs mt-0.5">
                {date.toLocaleDateString('zh-CN', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-300/40 hover:text-blue-300/80 text-xl transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* 内容区 */}
          {content ? (
            <div>
              <div className="text-blue-300/50 text-xs mb-2">记录内容</div>
              <div className="bg-white/5 rounded-xl p-4 text-blue-100/80 text-sm leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            </div>
          ) : record.encrypted ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🔒</div>
              <p className="text-blue-200/60 mb-2">内容已加密保护</p>
              <p className="text-blue-300/30 text-sm mb-5">使用钱包签名解密，私钥永远不离开你的设备</p>
              {error && (
                <p className="text-red-400/70 text-xs mb-4">{error}</p>
              )}
              <button
                onClick={handleDecrypt}
                disabled={decrypting}
                className="btn-primary px-6 py-2.5"
              >
                {decrypting ? '解密中...' : '🔓 签名解密'}
              </button>
            </div>
          ) : (
            <div className="bg-white/5 rounded-xl p-4 text-blue-100/80 text-sm leading-relaxed">
              {record.preview}
            </div>
          )}

          {/* 元数据 */}
          <div className="border-t border-white/5 pt-4 space-y-2">
            <div className="text-blue-300/40 text-xs mb-2">存证信息</div>

            <MetaRow label="记录类型" value={`${config.label} ${record.encrypted ? '(已加密)' : '(明文)'}`} />

            {record.arweave_cid && (
              <MetaRow
                label="Arweave CID"
                value={record.arweave_cid.slice(0, 20) + '...'}
                link={`https://arweave.net/${record.arweave_cid}`}
              />
            )}

            {record.solana_tx_hash && (
              <MetaRow
                label="Solana 存证"
                value={isOnChain ? record.solana_tx_hash.slice(0, 20) + '...' : '处理中...'}
                link={isOnChain ? `https://explorer.solana.com/tx/${record.solana_tx_hash}?cluster=devnet` : undefined}
                badge={isOnChain ? '已上链' : '待确认'}
                badgeColor={isOnChain ? 'text-green-400' : 'text-amber-400'}
              />
            )}

            {record.is_nft && record.nft_mint && (
              <MetaRow
                label="NFT Mint"
                value={record.nft_mint.slice(0, 20) + '...'}
                link={`https://explorer.solana.com/address/${record.nft_mint}?cluster=devnet`}
              />
            )}
          </div>

          {/* Arweave 原始数据（可展开） */}
          {record.arweave_cid && (
            <div className="border-t border-white/5 pt-4">
              {!arweaveData ? (
                <button
                  onClick={handleFetchArweave}
                  disabled={loadingArweave}
                  className="text-blue-300/40 text-xs hover:text-blue-300/70 transition-colors"
                >
                  {loadingArweave ? '获取中...' : '查看 Arweave 原始数据 →'}
                </button>
              ) : (
                <div>
                  <div className="text-blue-300/40 text-xs mb-2">Arweave 原始数据</div>
                  <pre className="text-blue-300/50 text-xs overflow-x-auto bg-white/5 rounded-lg p-3">
                    {arweaveData}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function MetaRow({
  label, value, link, badge, badgeColor,
}: {
  label: string
  value: string
  link?: string
  badge?: string
  badgeColor?: string
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-blue-300/30 w-24 flex-shrink-0">{label}</span>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400/60 hover:text-blue-400 transition-colors font-mono"
        >
          {value}
        </a>
      ) : (
        <span className="text-blue-200/60 font-mono">{value}</span>
      )}
      {badge && <span className={`${badgeColor} ml-1`}>{badge}</span>}
    </div>
  )
}
