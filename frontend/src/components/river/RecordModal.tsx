'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useWallet, useAnchorWallet } from '@solana/wallet-adapter-react'
import type { MemoryRecord, BaziResult, RecordType } from '@/types'
import { deriveEncryptionKey, encryptData, hashPayload, hashToHex, getCachedKey, setCachedKey } from '@/lib/crypto/encryption'
import { uploadToArweave } from '@/lib/storage/irys'
import { createRecordOnChain } from '@/lib/solana/program'
import toast from 'react-hot-toast'

interface RecordModalProps {
  template?: string
  prefill?: string
  bazi?: BaziResult
  onClose: () => void
  onSaved: (record: MemoryRecord) => void
}

export function RecordModal({ template, prefill, bazi, onClose, onSaved }: RecordModalProps) {
  const { publicKey, signMessage } = useWallet()
  const anchorWallet = useAnchorWallet()
  const [content, setContent] = useState(prefill || '')
  const [recordType, setRecordType] = useState<RecordType>('text')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isEncrypted, setIsEncrypted] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStep, setSaveStep] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    if (!content.trim() && !selectedFile) {
      toast.error('请输入内容或选择文件')
      return
    }
    if (!publicKey || !signMessage) {
      toast.error('请先连接钱包')
      return
    }

    setIsSaving(true)

    try {
      const walletAddr = publicKey.toString()
      let encryptionKey = getCachedKey(walletAddr)

      if (!encryptionKey && isEncrypted) {
        setSaveStep('请在钱包中签名以派生加密密钥...')
        encryptionKey = await deriveEncryptionKey(signMessage, walletAddr)
        setCachedKey(walletAddr, encryptionKey)
      }

      setSaveStep('加密数据中...')
      const textContent = recordType === 'text' ? content : `[${recordType}文件]`
      const payload = isEncrypted && encryptionKey
        ? await encryptData(textContent, encryptionKey)
        : { ciphertext: btoa(textContent), iv: '', authTag: '', version: 1 }

      const hash = await hashPayload(payload)
      const hashHex = hashToHex(hash)
      const recordId = `${walletAddr.slice(0, 8)}_${Date.now()}`

      setSaveStep('上传至 Arweave 永久存储...')
      const uploadResult = await uploadToArweave(payload, {
        type: recordType,
        wallet: walletAddr,
        recordId,
        timestamp: new Date().toISOString(),
      })

      setSaveStep('Solana 链上存证...')
      let solanaTxHash = 'pending'
      try {
        if (anchorWallet) {
          const RECORD_TYPES: Record<RecordType, number> = {
            text: 0, image: 1, video: 2, audio: 3, file: 4,
          }
          solanaTxHash = await createRecordOnChain({
            wallet: anchorWallet,
            contentHashHex: hashHex,
            arweaveCid: uploadResult.cid,
            recordType: RECORD_TYPES[recordType],
            encrypted: isEncrypted,
          })
        } else {
          const solanaRes = await fetch('/api/solana/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contentHash: hashHex, arweaveCid: uploadResult.cid, wallet: walletAddr }),
          })
          if (solanaRes.ok) {
            solanaTxHash = (await solanaRes.json()).txHash
          }
        }
      } catch (solErr) {
        if (solErr instanceof Error && solErr.message === 'IDL_NOT_FOUND') {
          try {
            const solanaRes = await fetch('/api/solana/record', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contentHash: hashHex, arweaveCid: uploadResult.cid, wallet: walletAddr }),
            })
            if (solanaRes.ok) solanaTxHash = (await solanaRes.json()).txHash
          } catch { /* 静默 */ }
        }
      }

      setSaveStep('保存记录元数据...')
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddr,
          arweave_cid: uploadResult.cid,
          solana_tx_hash: solanaTxHash,
          type: recordType,
          preview: isEncrypted
            ? content.substring(0, 60) + (content.length > 60 ? '...' : '')
            : content,
          encrypted: isEncrypted,
          inspiration_id: null,
        }),
      })

      const newRecord: MemoryRecord = {
        id: recordId,
        owner: walletAddr,
        type: recordType,
        preview: content.substring(0, 80),
        arweave_cid: uploadResult.cid,
        solana_tx_hash: solanaTxHash,
        created_at: new Date().toISOString(),
        encrypted: isEncrypted,
        is_nft: false,
      }

      onSaved(newRecord)
    } catch (err) {
      console.error('保存失败:', err)
      toast.error(`保存失败: ${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      setIsSaving(false)
      setSaveStep('')
    }
  }

  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        background: 'rgba(28, 25, 23, 0.45)', backdropFilter: 'blur(8px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="card-lg"
        style={{ width: '100%', maxWidth: '520px', padding: '28px' }}
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* 顶部 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {template ? `记录：${getTemplateName(template)}` : '记录时光'}
            </h2>
            {bazi && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                今日 {bazi.day_ten_god} · {bazi.day_ten_god_description.slice(0, 18)}...
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              fontSize: '20px', color: 'var(--text-muted)', cursor: 'pointer',
              background: 'none', border: 'none', lineHeight: 1, padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* 记录类型 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[
            { type: 'text' as RecordType, icon: '✍️', label: '文字' },
            { type: 'image' as RecordType, icon: '🖼️', label: '图片' },
            { type: 'audio' as RecordType, icon: '🎵', label: '音频' },
            { type: 'file' as RecordType, icon: '📎', label: '文件' },
          ].map(item => (
            <button
              key={item.type}
              onClick={() => {
                setRecordType(item.type)
                if (item.type !== 'text') fileInputRef.current?.click()
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                border: recordType === item.type ? '2px solid var(--text-primary)' : '1px solid var(--border)',
                background: recordType === item.type ? 'var(--bg-subtle)' : 'var(--bg-card)',
                color: 'var(--text-primary)', fontSize: '13px',
                fontWeight: recordType === item.type ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* 内容输入 */}
        {recordType === 'text' ? (
          <textarea
            className="input"
            style={{ width: '100%', height: '160px', resize: 'none', fontSize: '14px', lineHeight: 1.7, marginBottom: '16px' }}
            placeholder={getPlaceholder(template, bazi)}
            value={content}
            onChange={e => setContent(e.target.value)}
            autoFocus
          />
        ) : (
          <div
            style={{
              width: '100%', height: '120px', borderRadius: '12px',
              border: '2px dashed var(--border)', background: 'var(--bg-subtle)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', marginBottom: '16px',
              transition: 'background 0.15s',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {selectedFile ? (
              <>
                <span style={{ fontSize: '24px', marginBottom: '8px' }}>✅</span>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedFile.name}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </>
            ) : (
              <>
                <span style={{ fontSize: '24px', marginBottom: '8px' }}>📁</span>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>点击选择文件</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) {
                  setSelectedFile(file)
                  setContent(`[${file.name}]`)
                }
              }}
              accept={recordType === 'image' ? 'image/*' : recordType === 'audio' ? 'audio/*' : '*'}
            />
          </div>
        )}

        {/* 加密选项 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '20px', padding: '12px 14px', borderRadius: '10px',
          background: 'var(--bg-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsEncrypted(!isEncrypted)}
              style={{
                position: 'relative', width: '40px', height: '22px', borderRadius: '11px',
                border: 'none', cursor: 'pointer',
                background: isEncrypted ? 'var(--text-primary)' : 'var(--border)',
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute', top: '3px', width: '16px', height: '16px',
                borderRadius: '50%', background: '#fff',
                left: isEncrypted ? '21px' : '3px', transition: 'left 0.2s',
              }} />
            </button>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {isEncrypted ? '🔐 AES-256-GCM 加密' : '🔓 明文存储'}
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>~0.000005 SOL</span>
        </div>

        {/* 保存按钮 */}
        {isSaving ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div className="loading-dots" style={{ marginBottom: '8px' }}><span /><span /><span /></div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{saveStep}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} className="btn-outline" style={{ flex: 1, padding: '12px', fontSize: '14px' }}>
              取消
            </button>
            <button onClick={handleSave} className="btn-primary" style={{ flex: 1, padding: '12px', fontSize: '14px' }}>
              永久封存 →
            </button>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
          记录将永久存储于 Arweave，上链后无法删除
        </p>
      </motion.div>
    </motion.div>
  )
}

function getTemplateName(template: string): string {
  const names: Record<string, string> = {
    gratitude: '感恩三事',
    emotion_weather: '情绪气象站',
    highlight: '高光时刻',
    future_letter: '对话未来',
    destiny_insight: '命理觉察',
  }
  return names[template] || template
}

function getPlaceholder(template?: string, bazi?: BaziResult): string {
  if (template === 'gratitude') return '今天感谢的三件事：\n1. \n2. \n3. '
  if (template === 'emotion_weather') return '如果用天气来形容，此刻是___，因为___。'
  if (template === 'highlight') return '今天的高光时刻：\n发生了什么：\n我的感受是：'
  if (bazi) return `今日${bazi.day_ten_god}，${bazi.day_ten_god_description}。写下你的觉察...`
  return '此刻你想记录什么？每一字都将永存于链上...'
}
