import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import MySidebarTrigger from '@/components/custom/sidebar-trigger'
import FreestyleList from '@/components/custom/freestyle-list'
import SilentPhoneWarning from '@/components/custom/silent-phone-warning'

export default async function Freestyle() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/sign-in')
  }

  return (
    <div className="w-full">
      <MySidebarTrigger />
      <SilentPhoneWarning />
      <FreestyleList />
    </div>
  )
}
