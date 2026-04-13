import type { Metadata, Viewport } from 'next'
import './globals.css'
import { WalletProviders } from '@/components/common/WalletProviders'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Time River · 时光流',
  description: '记录即修行，觉察即改命 — AI 驱动的生命记录协议',
  keywords: ['八字', '命理', 'Solana', 'Arweave', 'Web3', '日记', '人生记录'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FAFAF8',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <WalletProviders>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#FFFFFF',
                border: '1px solid #E7E5E4',
                color: '#1C1917',
                borderRadius: '12px',
                fontSize: '14px',
                boxShadow: '0 4px 20px rgba(28,25,23,0.12)',
              },
              success: {
                iconTheme: { primary: '#16a34a', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#dc2626', secondary: '#fff' },
              },
            }}
          />
        </WalletProviders>
      </body>
    </html>
  )
}
