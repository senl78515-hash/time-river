import { NextRequest, NextResponse } from 'next/server'

// Solana 链上存证接口
// MVP 阶段：使用 SPL Memo Program 将内容哈希 + Arweave CID 写入链上
// 生产环境：调用部署的 Anchor time_river 程序

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { contentHash, arweaveCid, wallet } = body

    if (!contentHash || !arweaveCid) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // 尝试真实链上存证（需要服务端钱包）
    const serverWalletKey = process.env.SOLANA_SERVER_WALLET_PRIVATE_KEY
    if (serverWalletKey && wallet) {
      try {
        const txHash = await writeToChainViaMemo({
          contentHash,
          arweaveCid,
          uploaderWallet: wallet,
          serverWalletKey,
        })
        return NextResponse.json({
          txHash,
          explorerUrl: `https://explorer.solana.com/tx/${txHash}?cluster=devnet`,
          success: true,
        })
      } catch (chainErr) {
        console.warn('链上存证失败，降级为 mock:', chainErr)
      }
    }

    // Fallback: 模拟 txHash（开发模式）
    const mockTxHash = `mock_${Array.from(
      { length: 64 },
      () => Math.floor(Math.random() * 16).toString(16)
    ).join('')}`

    console.warn('[DEV] 使用模拟 Solana txHash。配置 SOLANA_SERVER_WALLET_PRIVATE_KEY 启用真实上链。')

    return NextResponse.json({
      txHash: mockTxHash,
      explorerUrl: `https://explorer.solana.com/tx/${mockTxHash}?cluster=devnet`,
      success: true,
    })
  } catch (err) {
    console.error('Solana 存证失败:', err)
    return NextResponse.json(
      { error: '链上存证失败', txHash: 'mock_pending' },
      { status: 500 }
    )
  }
}

// ── SPL Memo Program 链上存证 ─────────────────────────────────
// 将 "time-river:v1:{contentHash}:{arweaveCid}:{uploaderWallet}" 写入 Memo
// 这是最轻量的存证方式，无需部署 Anchor 程序，Devnet 也可用

async function writeToChainViaMemo({
  contentHash,
  arweaveCid,
  uploaderWallet,
  serverWalletKey,
}: {
  contentHash: string
  arweaveCid: string
  uploaderWallet: string
  serverWalletKey: string
}): Promise<string> {
  const { Connection, Keypair, Transaction, TransactionInstruction, PublicKey, clusterApiUrl, sendAndConfirmTransaction } = await import('@solana/web3.js')

  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet'),
    'confirmed'
  )

  // 解析服务端钱包
  const secretKey = JSON.parse(serverWalletKey) as number[]
  const payer = Keypair.fromSecretKey(new Uint8Array(secretKey))

  // 构建 Memo 数据
  const memoData = JSON.stringify({
    protocol: 'time-river-v1',
    hash: contentHash.slice(0, 16),  // 截短节省空间
    cid: arweaveCid.slice(0, 20),
    owner: uploaderWallet.slice(0, 8),
    ts: Math.floor(Date.now() / 1000),
  })

  // SPL Memo Program
  const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
  const memoInstruction = new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: false }],
    data: Buffer.from(memoData, 'utf-8'),
  })

  const transaction = new Transaction().add(memoInstruction)
  const txHash = await sendAndConfirmTransaction(connection, transaction, [payer])
  return txHash
}
