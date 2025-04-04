import MySidebarTrigger from '@/components/custom/sidebar-trigger'
import FreestyleList from '@/components/custom/freestyle-list'
import SilentPhoneWarning from '@/components/custom/silent-phone-warning'

export default function Freestyle() {
  return (
    <>
      <div className="w-full">
        <MySidebarTrigger />
        <SilentPhoneWarning />
        <FreestyleList />
      </div>
    </>
  )
}
