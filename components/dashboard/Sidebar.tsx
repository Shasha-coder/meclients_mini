'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Phone, Settings, LogOut, Zap } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/bookings', icon: Calendar, label: 'Bookings' },
  { href: '/calls', icon: Phone, label: 'Calls' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export default function DashboardSidebar({ tenant, user }: { tenant: any; user: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient()

  const agentStatus = tenant?.retell_agents?.[0]?.status
  const phoneNumber = tenant?.phone_numbers?.[0]?.number

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-surface-border flex flex-col z-10">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-surface-border">
        <span className="text-lg font-semibold text-ink">meclients</span>
      </div>

      {/* Agent status pill */}
      <div className="px-4 py-4 border-b border-surface-border">
        <div className={`flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-xs font-medium ${
          agentStatus === 'live'
            ? 'bg-brand-50 text-brand-700'
            : agentStatus === 'pending_review'
            ? 'bg-amber-50 text-amber-700'
            : 'bg-surface-muted text-ink-muted'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            agentStatus === 'live' ? 'bg-brand-500 animate-pulse' :
            agentStatus === 'pending_review' ? 'bg-amber-400' : 'bg-gray-300'
          }`} />
          <div>
            <p>{agentStatus === 'live' ? 'Agent live' : agentStatus === 'pending_review' ? 'Pending review' : 'Agent inactive'}</p>
            {phoneNumber && <p className="text-ink-faint font-normal mt-0.5">{phoneNumber}</p>}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              active
                ? 'bg-brand-50 text-brand-700'
                : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
            }`}>
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + signout */}
      <div className="px-3 py-4 border-t border-surface-border space-y-1">
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-ink truncate">{tenant?.business_name}</p>
          <p className="text-xs text-ink-faint truncate">{user?.email}</p>
        </div>
        <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ink-muted hover:bg-surface-muted hover:text-ink transition-colors">
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </aside>
  )
}
