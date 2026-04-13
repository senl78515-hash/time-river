'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLang } from '@/lib/i18n'
import type { BaziResult } from '@/types'

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(m => m.WalletMultiButton),
  { ssr: false }
)

interface NavBarProps {
  bazi?: BaziResult
  onBaziLoaded?: (bazi: BaziResult) => void
}

export function NavBar({ bazi, onBaziLoaded: _unused }: NavBarProps) {
  const { connected } = useWallet()
  const pathname = usePathname()
  const { t, toggle } = useLang()

  const navItems = [
    { href: '/home',        label: t('nav_home'),    icon: '🏠' },
    { href: '/records',     label: t('nav_records'), icon: '🌊' },
    { href: '/destiny',     label: t('nav_destiny'), icon: '✦'  },
    { href: '/marketplace', label: t('nav_market'),  icon: '💎' },
  ]

  return (
    <div className="navbar">
      {/* Brand */}
      <Link href="/" className="nav-brand">
        <span style={{ fontSize: '20px' }}>🌊</span>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>{t('nav_brand')}</div>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
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
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>🔥 7{t('nav_streak')}</div>
        )}

        {/* Language toggle */}
        <button
          onClick={toggle}
          style={{
            padding: '5px 12px',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.04em',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.borderColor = 'var(--text-secondary)'
            el.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.borderColor = 'var(--border)'
            el.style.color = 'var(--text-secondary)'
          }}
        >
          {t('lang_toggle')}
        </button>

        <WalletMultiButton />
      </div>
    </div>
  )
}
