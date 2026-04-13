/**
 * Time River — Arweave 永久存储层 (via Irys)
 * 上传加密后的记录文件，实现重试机制与 IPFS 备选
 */

import type { EncryptedPayload } from '@/lib/crypto/encryption'

export interface UploadResult {
  cid: string           // Arweave Transaction ID (也称 CID)
  url: string           // 可访问的 URL
  gateway: 'arweave' | 'ipfs'
  size: number
}

// ── 上传加密 JSON 记录到 Arweave ─────────────────────────────
/**
 * 将加密后的内容上传到 Arweave（通过 Irys 节点）
 * 实现自动重试 + IPFS 备选
 *
 * 注意：Irys 上传需要 Solana 钱包签名支付（使用 devnet 测试时可免费）
 */
export async function uploadToArweave(
  payload: EncryptedPayload,
  metadata: {
    type: string        // 文件类型
    wallet: string      // 上传者钱包地址
    recordId: string    // 记录唯一 ID
    timestamp: string
  }
): Promise<UploadResult> {
  const content = JSON.stringify({
    encrypted: payload,
    metadata: {
      ...metadata,
      protocol: 'time-river-v1',
    },
  })

  const bytes = new TextEncoder().encode(content)

  // 最多重试 3 次
  let lastError: Error | null = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await uploadViaIrysServer(bytes, 'application/json', metadata.wallet)
      return result
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn(`Arweave 上传第 ${attempt} 次失败:`, lastError.message)
      if (attempt < 3) {
        // 指数退避
        await delay(attempt * 1000)
      }
    }
  }

  // Arweave 失败，尝试 IPFS 备选
  console.warn('Arweave 上传失败，尝试 IPFS 备选...')
  try {
    const ipfsResult = await uploadToIPFS(bytes, 'application/json')
    return ipfsResult
  } catch (ipfsErr) {
    throw new Error(`存储上传完全失败。Arweave: ${lastError?.message}. IPFS: ${ipfsErr}`)
  }
}

// ── 通过服务端 API Route 上传（客户端调用）─────────────────────
async function uploadViaIrysServer(
  data: Uint8Array,
  contentType: string,
  wallet: string
): Promise<UploadResult> {
  // 将数据转为 Base64 发送给 API Route
  const base64 = btoa(String.fromCharCode(...data))

  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: base64, contentType, wallet }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Upload API 错误: ${response.status} - ${err}`)
  }

  return response.json()
}

// ── IPFS 备选上传 (Pinata) ────────────────────────────────────
async function uploadToIPFS(data: Uint8Array, contentType: string): Promise<UploadResult> {
  const formData = new FormData()
  const blob = new Blob([new Uint8Array(data)], { type: contentType })
  formData.append('file', blob, 'record.json')

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT || ''}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Pinata 上传失败: ${response.status}`)
  }

  const result = await response.json()
  const cid = result.IpfsHash

  return {
    cid,
    url: `https://gateway.pinata.cloud/ipfs/${cid}`,
    gateway: 'ipfs',
    size: data.length,
  }
}

// ── 从 Arweave 获取内容 ────────────────────────────────────────
export async function fetchFromArweave(cid: string): Promise<EncryptedPayload | null> {
  const gateways = [
    `https://arweave.net/${cid}`,
    `https://gateway.irys.xyz/${cid}`,
    `https://ar-io.net/${cid}`,
  ]

  for (const url of gateways) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
      if (response.ok) {
        const data = await response.json()
        return data.encrypted as EncryptedPayload
      }
    } catch {
      continue
    }
  }

  return null
}

// ── 上传文件（图片/视频/音频）────────────────────────────────
export async function uploadEncryptedFile(
  encryptedBlob: Blob,
  originalMimeType: string,
  wallet: string
): Promise<UploadResult> {
  const bytes = new Uint8Array(await encryptedBlob.arrayBuffer())
  const base64 = btoa(String.fromCharCode(...bytes))

  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: base64,
      contentType: 'application/octet-stream',
      originalMimeType,
      wallet,
    }),
  })

  if (!response.ok) {
    throw new Error(`文件上传失败: ${response.status}`)
  }

  return response.json()
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
