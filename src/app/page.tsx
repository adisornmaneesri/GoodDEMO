import Link from 'next/link'
import { Sparkles, Gavel, ShoppingBag, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a1a28_0%,_#050508_70%)]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        {/* Floating cards background */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-20 h-28 rounded-xl border opacity-10 animate-float"
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                borderColor: ['#9ca3af','#34d399','#60a5fa','#a78bfa','#fbbf24','#f472b6'][i],
                animationDelay: `${i * 0.5}s`,
                background: 'linear-gradient(135deg, #1a1a28, #252538)',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full glass text-gold-400 text-sm font-medium">
            ✦ แพลตฟอร์มการ์ดสะสมอันดับ 1
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-gold-gradient">CardVault</span>
            <br />
            <span className="text-white text-3xl md:text-4xl font-normal">ซื้อ ขาย สุ่ม ประมูล</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            แพลตฟอร์มครบวงจรสำหรับนักสะสมการ์ด เปิดแพ็คสุ่ม ประมูล real-time และซื้อขายระหว่างผู้ใช้
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pack" className="btn-gold text-lg px-8 py-3 inline-flex items-center gap-2">
              <Sparkles size={20} />
              เปิดแพ็คเลย
            </Link>
            <Link href="/auction" className="btn-outline text-lg px-8 py-3 inline-flex items-center gap-2">
              <Gavel size={20} />
              ดูการประมูล
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 max-w-6xl mx-auto w-full">
        <h2 className="font-display text-3xl text-center text-white mb-16">
          ทุกอย่างในที่<span className="text-gold-gradient">เดียว</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: ShoppingBag, title: 'ร้านค้า', desc: 'เลือกซื้อการ์ดได้โดยตรง จัดส่งถึงบ้าน', href: '/shop', color: '#60a5fa' },
            { icon: Sparkles,    title: 'สุ่มแพ็ค', desc: 'ลุ้นการ์ด Legend และ Secret จากแพ็คราคาถูก', href: '/pack', color: '#fbbf24' },
            { icon: Gavel,       title: 'ประมูล', desc: 'ประมูล real-time ชิงการ์ดหายากสุดเด็ด', href: '/auction', color: '#a78bfa' },
            { icon: Shield,      title: 'คลังการ์ด', desc: 'เก็บและจัดการคอลเลคชันทั้งหมดของคุณ', href: '/dashboard', color: '#34d399' },
          ].map(({ icon: Icon, title, desc, href, color }) => (
            <Link key={title} href={href} className="card-dark p-6 card-hover group cursor-pointer">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                   style={{ background: `${color}20` }}>
                <Icon size={24} style={{ color }} />
              </div>
              <h3 className="font-display text-white text-lg mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto card-dark p-12"
             style={{ background: 'linear-gradient(135deg, #1a1a28, #252538)' }}>
          <h2 className="font-display text-3xl text-white mb-4">พร้อมเริ่มสะสมแล้วใช่ไหม?</h2>
          <p className="text-gray-400 mb-8">สมัครฟรี รับ 500 เครดิต สำหรับสุ่มแพ็คแรก</p>
          <Link href="/auth/register" className="btn-gold text-lg px-10 py-3 inline-block">
            สมัครสมาชิกฟรี
          </Link>
        </div>
      </section>
    </div>
  )
}
