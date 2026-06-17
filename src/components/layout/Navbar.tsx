'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Wallet, Menu, X, Sparkles, Gavel, ShoppingBag, LayoutDashboard, LogOut, Settings } from 'lucide-react'

const NAV_LINKS = [
  { href: '/shop',      label: 'ร้านค้า',   icon: ShoppingBag },
  { href: '/pack',      label: 'สุ่มแพ็ค',  icon: Sparkles },
  { href: '/auction',   label: 'ประมูล',    icon: Gavel },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
]

export default function Navbar() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(data)
      } else {
        setProfile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 bg-dark-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="font-display text-xl font-bold text-gold-gradient">
          ✦ CardVault
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-gold-500/10 text-gold-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {profile ? (
            <>
              <div className="hidden md:flex items-center gap-2 bg-dark-600 px-3 py-1.5 rounded-lg border border-dark-500">
                <Wallet size={14} className="text-gold-400" />
                <span className="text-sm text-gold-400 font-semibold">
                  ฿{profile.wallet.toLocaleString()}
                </span>
              </div>
              <Link href="/dashboard" className="hidden md:flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <LayoutDashboard size={18} />
              </Link>
              {profile.role === 'admin' && (
                <Link href="/admin" className="hidden md:flex text-gold-400 hover:text-gold-300">
                  <Settings size={18} />
                </Link>
              )}
              <button onClick={signOut} className="hidden md:flex text-gray-500 hover:text-red-400 transition-colors">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/auth/login" className="btn-outline text-sm py-1.5 px-4">เข้าสู่ระบบ</Link>
              <Link href="/auth/register" className="btn-gold text-sm py-1.5 px-4">สมัครสมาชิก</Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button className="md:hidden text-gray-400" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-dark-500 bg-dark-800 px-4 py-4 flex flex-col gap-2">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-dark-700">
              <Icon size={18} className="text-gold-400" />
              {label}
            </Link>
          ))}
          {profile ? (
            <>
              <div className="flex items-center gap-2 px-4 py-3 text-gold-400">
                <Wallet size={18} />
                ฿{profile.wallet.toLocaleString()}
              </div>
              <Link href="/dashboard" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-dark-700">
                <LayoutDashboard size={18} className="text-gold-400" /> คลังการ์ด
              </Link>
              <button onClick={() => { signOut(); setOpen(false) }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400">
                <LogOut size={18} /> ออกจากระบบ
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/auth/login" onClick={() => setOpen(false)} className="btn-outline text-center">เข้าสู่ระบบ</Link>
              <Link href="/auth/register" onClick={() => setOpen(false)} className="btn-gold text-center">สมัครสมาชิก</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
