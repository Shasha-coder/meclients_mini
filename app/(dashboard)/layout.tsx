import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardSidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*, business_profiles(*), retell_agents(*), phone_numbers(*)')
    .eq('owner_id', user.id)
    .single()

  // First time user - send to onboarding
  if (!tenant?.business_profiles?.length) redirect('/onboarding')

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <DashboardSidebar tenant={tenant} user={user} />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
