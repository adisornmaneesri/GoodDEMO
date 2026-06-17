'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('เข้าสู่ระบบสำเร็จ!')
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const loginGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card-dark p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-gold-gradient mb-2">เข้าสู่ระบบ</h1>
          <p className="text-gray-400">ยินดีต้อนรับกลับ</p>
        </div>

        <form onSubmit={login} className="space-y-4 mb-6">
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">อีเมล</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" required className="input-dark" />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">รหัสผ่าน</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required className="input-dark" />
          </div>
          <button type="submit" disabled={loading} className="btn-gold w-full flex items-center justify-center gap-2">
            <LogIn size={18} />
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dark-500" />
          </div>
          <div className="relative text-center text-sm text-gray-500 bg-dark-700 px-4 w-fit mx-auto">หรือ</div>
        </div>

        <button onClick={loginGoogle} className="w-full btn-outline flex items-center justify-center gap-3 mb-6">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          เข้าสู่ระบบด้วย Google
        </button>

        <p className="text-center text-gray-500 text-sm">
          ยังไม่มีบัญชี?{' '}
          <Link href="/auth/register" className="text-gold-400 hover:text-gold-300">สมัครสมาชิก</Link>
        </p>
      </div>
    </div>
  )
}
