/**
 * Time River — 前端加密层
 * AES-256-GCM 加密，密钥由 Solana 钱包签名消息派生（HKDF-SHA256）
 *
 * 安全原则：
 * - 私钥永不离开用户设备
 * - 所有加密操作在浏览器端完成
 * - 加密数据是唯一上传到 Arweave 的内容
 */

const DERIVE_MESSAGE = 'Time River Encryption Key v1 - Sign to derive your personal encryption key'
const HKDF_INFO = new TextEncoder().encode('time-river-aes-256-gcm')
const HKDF_SALT = new TextEncoder().encode('time-river-salt-2024')

export interface EncryptedPayload {
  ciphertext: string    // Base64 编码的密文
  iv: string            // Base64 编码的初始向量（96位）
  authTag: string       // 认证标签（包含在 GCM 输出中）
  version: number       // 加密版本号，用于未来升级
}

// ── 密钥派生 ──────────────────────────────────────────────────
/**
 * 从钱包签名中派生 AES-256 密钥
 * 使用 HKDF-SHA256 从钱包签名的随机性中提取密钥材料
 *
 * @param signMessage 钱包 Adapter 提供的 signMessage 函数
 * @param walletPublicKey 钱包公钥（用于域隔离）
 */
export async function deriveEncryptionKey(
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
  walletPublicKey: string
): Promise<CryptoKey> {
  // 消息包含钱包地址，确保不同钱包派生不同密钥
  const message = new TextEncoder().encode(
    `${DERIVE_MESSAGE}\nWallet: ${walletPublicKey}`
  )

  // 请求钱包签名（用户授权一次）
  const signature = await signMessage(message)

  // 从签名中导入密钥材料（确保是标准 ArrayBuffer）
  const signatureBuffer = signature.buffer instanceof ArrayBuffer
    ? signature.buffer.slice(signature.byteOffset, signature.byteOffset + signature.byteLength)
    : new Uint8Array(signature).buffer as ArrayBuffer

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    signatureBuffer,
    'HKDF',
    false,
    ['deriveKey']
  )

  // HKDF 派生最终 AES-256-GCM 密钥
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: HKDF_SALT,
      info: HKDF_INFO,
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,    // 密钥不可导出
    ['encrypt', 'decrypt']
  )

  return aesKey
}

// ── 加密 ──────────────────────────────────────────────────────
/**
 * 使用 AES-256-GCM 加密数据
 * GCM 模式自带认证标签，防止密文篡改
 */
export async function encryptData(
  data: Uint8Array | string,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const rawPlaintext = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : data
  // 确保是标准 ArrayBuffer（兼容 TypeScript 5.x 严格类型）
  const plaintext = rawPlaintext.buffer.slice(
    rawPlaintext.byteOffset,
    rawPlaintext.byteOffset + rawPlaintext.byteLength
  ) as ArrayBuffer

  // 每次加密生成随机 IV（96位 = 12字节，GCM 标准）
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource, tagLength: 128 },
    key,
    plaintext
  )

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
    authTag: '',  // GCM 认证标签包含在 ciphertext 末尾
    version: 1,
  }
}

// ── 解密 ──────────────────────────────────────────────────────
/**
 * 解密 AES-256-GCM 密文
 * 认证失败（数据被篡改）时会抛出错误
 */
export async function decryptData(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<Uint8Array> {
  const ciphertext = base64ToArrayBuffer(payload.ciphertext)
  const iv = base64ToArrayBuffer(payload.iv)

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource, tagLength: 128 },
    key,
    ciphertext as unknown as BufferSource
  )

  return new Uint8Array(plaintext)
}

/**
 * 解密并返回字符串
 */
export async function decryptToString(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<string> {
  const bytes = await decryptData(payload, key)
  return new TextDecoder().decode(bytes)
}

// ── 文件处理 ──────────────────────────────────────────────────
/**
 * 加密 File 对象
 */
export async function encryptFile(
  file: File,
  key: CryptoKey
): Promise<{ payload: EncryptedPayload; mimeType: string; originalName: string; size: number }> {
  const buffer = await file.arrayBuffer()
  const payload = await encryptData(new Uint8Array(buffer), key)

  return {
    payload,
    mimeType: file.type,
    originalName: file.name,
    size: file.size,
  }
}

// ── SHA-256 内容哈希 ──────────────────────────────────────────
/**
 * 计算加密密文的 SHA-256 哈希（用于链上存证）
 */
export async function hashPayload(payload: EncryptedPayload): Promise<Uint8Array> {
  const data = new TextEncoder().encode(payload.ciphertext + payload.iv)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(hashBuffer)
}

export function hashToHex(hash: Uint8Array): string {
  return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── 工具函数 ──────────────────────────────────────────────────
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// ── 加密密钥缓存（会话级） ────────────────────────────────────
// 避免每次操作都请求钱包签名
const keyCache = new Map<string, CryptoKey>()

export function getCachedKey(walletPublicKey: string): CryptoKey | undefined {
  return keyCache.get(walletPublicKey)
}

export function setCachedKey(walletPublicKey: string, key: CryptoKey): void {
  keyCache.set(walletPublicKey, key)
}

export function clearKeyCache(): void {
  keyCache.clear()
}
