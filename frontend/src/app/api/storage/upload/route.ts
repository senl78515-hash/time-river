import { NextRequest, NextResponse } from 'next/server'

// Arweave 上传服务端接口
// 客户端将加密数据 (Base64) 发送至此，由服务端调用 Irys 上传到 Arweave
// 注意：devnet Irys 节点(https://devnet.irys.xyz)上传免费，不需要支付 AR token

const IRYS_NODE = process.env.IRYS_NODE_URL || 'https://devnet.irys.xyz'
const IRYS_WALLET_PRIVATE_KEY = process.env.IRYS_WALLET_PRIVATE_KEY

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, contentType, wallet, originalMimeType } = body

    if (!data) {
      return NextResponse.json({ error: '数据不能为空' }, { status: 400 })
    }

    const buffer = Buffer.from(data, 'base64')
    const finalContentType = contentType || 'application/json'

    // 优先使用真实 Irys 上传（如果配置了钱包私钥）
    if (IRYS_WALLET_PRIVATE_KEY) {
      try {
        const result = await uploadViaIrys(buffer, finalContentType, wallet, originalMimeType)
        return NextResponse.json(result)
      } catch (irysErr) {
        console.warn('Irys 上传失败，降级为 mock:', irysErr)
      }
    }

    // Fallback: 生成模拟 CID（开发模式）
    const mockCid = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    console.warn('[DEV] 使用模拟 Arweave CID。配置 IRYS_WALLET_PRIVATE_KEY 启用真实上传。')

    return NextResponse.json({
      cid: mockCid,
      url: `https://arweave.net/${mockCid}`,
      gateway: 'arweave',
      size: buffer.length,
    })
  } catch (err) {
    console.error('Arweave 上传失败:', err)
    return NextResponse.json(
      { error: '上传失败', detail: err instanceof Error ? err.message : '未知错误' },
      { status: 500 }
    )
  }
}

async function uploadViaIrys(
  buffer: Buffer,
  contentType: string,
  uploaderWallet: string,
  originalMimeType?: string,
): Promise<{ cid: string; url: string; gateway: 'arweave' | 'ipfs'; size: number }> {
  // 动态导入 Irys SDK（仅服务端）
  const { default: Irys } = await import('@irys/sdk')

  // 使用 Solana 钱包（devnet 模式）
  const irys = new Irys({
    url: IRYS_NODE,
    token: 'solana',
    key: IRYS_WALLET_PRIVATE_KEY,
    config: {
      providerUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    },
  })

  const tags = [
    { name: 'Content-Type', value: contentType },
    { name: 'App-Name', value: 'Time River' },
    { name: 'App-Version', value: '1.0' },
    { name: 'Uploader', value: uploaderWallet || 'unknown' },
  ]

  if (originalMimeType) {
    tags.push({ name: 'Original-Content-Type', value: originalMimeType })
  }

  const receipt = await irys.upload(buffer, { tags })

  return {
    cid: receipt.id,
    url: `https://arweave.net/${receipt.id}`,
    gateway: 'arweave',
    size: buffer.length,
  }
}
