'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(m => m.WalletMultiButton),
  { ssr: false }
)
import { usePathname } from 'next/navigation'
import type { BaziResult } from '@/types'

interface NavBarProps {
  bazi?: BaziResult
  onBaziLoaded?: (bazi: BaziResult) => void
}

export function NavBar({ bazi, onBaziLoaded: _unused }: NavBarProps) {
  const { connected } = useWallet()
  const pathname = usePathname()

  const navItems = [
    { href: '/home',        label: '我的主页', icon: '🏠' },
    { href: '/records',     label: '时光之河', icon: '🌊' },
    { href: '/destiny',     label: '命书测算', icon: '✦'  },
    { href: '/marketplace', label: '经验市场', icon: '💎' },
  ]

  return (
    <div className="navbar">
      {/* Brand */}
      <Link href="/" className="nav-brand">
        <span style={{ fontSize: '20px' }}>🌊</span>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>Time River</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>时光流</div>
        </div>
      </Link>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
        {navItems.map(nav => (
          <Link
            key={nav.href}
            href={nav.href}
            className={`nav-link ${pathname === nav.href ? 'active' : ''}`}
          >
            <span style={{ fontSize: '13px' }}>{nav.icon}</span>
            <span>{nav.label}</span>
          </Link>
        ))}
      </nav>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        {bazi && (
          <div style={{
            padding: '4px 12px',
            borderRadius: '20px',
            background: 'var(--gold-light)',
            fontSize: '13px',
            color: 'var(--gold)',
            fontWeight: 500,
          }}>
            今日 {bazi.day_ten_god}
          </div>
        )}
        {connected && (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>🔥 7天</div>
        )}
        <WalletMultiButton />
      </div>
    </div>
  )
}
