import type { Metadata } from 'next'
import './../../styles/globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'CardVault — ซื้อขาย สุ่ม ประมูลการ์ด',
  description: 'แพลตฟอร์มซื้อขาย สุ่มแพ็ค และประมูลการ์ดสะสมออนไลน์',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <Navbar />
        <main className="min-h-screen pt-16">
          {children}
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a1a28', color: '#e2e8f0', border: '1px solid #252538' },
            success: { iconTheme: { primary: '#f59e0b', secondary: '#050508' } },
          }}
        />
      </body>
    </html>
  )
}
