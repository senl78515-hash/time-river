'use client'

import { useMemo, useCallback } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import type { WalletError } from '@solana/wallet-adapter-base'

import '@solana/wallet-adapter-react-ui/styles.css'

export function WalletProviders({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() =>
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet')
  , [])

  // ⚠️ 必须传空数组：Phantom / Solflare 等现代钱包已实现 Wallet Standard 规范，
  // 会被 wallet-adapter-react v0.15+ 自动检测注入。
  // 若手动传入 PhantomWalletAdapter（legacy），会产生重复注册冲突，
  // 导致 connect() Promise 永远挂起（"connecting" 卡死）。
  const wallets = useMemo(() => [], [])

  const onError = useCallback((error: WalletError) => {
    console.warn('[Wallet]', error.name, error.message)
    // 连接出错时清理缓存，避免下次打开页面仍触发错误连接
    try { localStorage.removeItem('walletName') } catch { /* 忽略 */ }
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false} onError={onError}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
