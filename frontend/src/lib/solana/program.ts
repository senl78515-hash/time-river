/**
 * Time River — Anchor 程序客户端
 * 封装 create_record / mint_sbt 指令调用
 * IDL 在运行时通过 fetch 获取，避免构建时依赖
 */

import { PublicKey, SystemProgram } from '@solana/web3.js'
import type { AnchorWallet } from '@solana/wallet-adapter-react'

export const TIME_RIVER_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_TIME_RIVER_PROGRAM_ID ||
  '4nbXrm7iiFt582tH1ohjnGKPYYT6QWG4swamwX18yv19'
)

// ── 派生 PDA ──────────────────────────────────────────────────

export function deriveRecordPda(
  owner: PublicKey,
  contentHash: Uint8Array
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('record'), owner.toBuffer(), Buffer.from(contentHash)],
    TIME_RIVER_PROGRAM_ID
  )
}

export function deriveSbtPda(
  owner: PublicKey,
  badgeType: string
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('sbt'), owner.toBuffer(), Buffer.from(badgeType)],
    TIME_RIVER_PROGRAM_ID
  )
}

// ── 获取 IDL（运行时，不影响构建）────────────────────────────
let cachedIdl: Record<string, unknown> | null = null

async function getIdl(): Promise<Record<string, unknown>> {
  if (cachedIdl) return cachedIdl

  // 尝试从 public 目录获取（构建后复制）
  try {
    const res = await fetch('/idl/time_river.json')
    if (res.ok) {
      cachedIdl = await res.json()
      return cachedIdl!
    }
  } catch { /* 未就绪 */ }

  throw new Error('IDL_NOT_FOUND')
}

// ── create_record 指令 ────────────────────────────────────────

export async function createRecordOnChain({
  wallet,
  contentHashHex,
  arweaveCid,
  recordType = 0,
  encrypted = true,
}: {
  wallet: AnchorWallet
  contentHashHex: string
  arweaveCid: string
  recordType?: number
  encrypted?: boolean
}): Promise<string> {
  const idl = await getIdl()

  const { Program, AnchorProvider } = await import('@coral-xyz/anchor')
  const { Connection, clusterApiUrl } = await import('@solana/web3.js')

  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet')
  const connection = new Connection(rpcUrl, 'confirmed')
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = new Program(idl as any, provider)

  const contentHash = Array.from(Buffer.from(contentHashHex, 'hex'))
  if (contentHash.length !== 32) throw new Error('contentHash 必须是 32 字节')

  const [recordPda] = deriveRecordPda(wallet.publicKey, new Uint8Array(contentHash))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = await (program.methods as any)
    .createRecord(contentHash, arweaveCid, recordType, encrypted)
    .accounts({
      owner: wallet.publicKey,
      record: recordPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return tx as string
}

// ── mint_sbt 指令 ─────────────────────────────────────────────

export async function mintSbtOnChain({
  wallet,
  badgeType,
  metadataUri,
}: {
  wallet: AnchorWallet
  badgeType: string
  metadataUri: string
}): Promise<string> {
  const idl = await getIdl()

  const { Program, AnchorProvider } = await import('@coral-xyz/anchor')
  const { Connection, clusterApiUrl } = await import('@solana/web3.js')

  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet')
  const connection = new Connection(rpcUrl, 'confirmed')
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = new Program(idl as any, provider)
  const [sbtPda] = deriveSbtPda(wallet.publicKey, badgeType)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = await (program.methods as any)
    .mintSbt(badgeType, metadataUri)
    .accounts({
      owner: wallet.publicKey,
      sbt: sbtPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return tx as string
}
