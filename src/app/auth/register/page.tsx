'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const register = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { toast.error('รหัสผ่านต้องอย่างน้อย 6 ตัว'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username } }
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('สมัครสำเร็จ! ตรวจสอบอีเมลของคุณ')
      router.push('/auth/login')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card-dark p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-gold-gradient mb-2">สมัครสมาชิก</h1>
          <p className="text-gray-400">รับเครดิตฟรี 500 บาท เมื่อสมัครใหม่</p>
        </div>

        <form onSubmit={register} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">ชื่อผู้ใช้</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="ชื่อที่ต้องการแสดง" required className="input-dark" />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">อีเมล</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" required className="input-dark" />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">รหัสผ่าน</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="อย่างน้อย 6 ตัวอักษร" required className="input-dark" />
          </div>
          <button type="submit" disabled={loading} className="btn-gold w-full flex items-center justify-center gap-2 mt-2">
            <UserPlus size={18} />
            {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          มีบัญชีแล้ว?{' '}
          <Link href="/auth/login" className="text-gold-400 hover:text-gold-300">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  )
}
