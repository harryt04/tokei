'use client'

import { usePathname } from 'next/navigation'
import { BirdIcon, Repeat2Icon, TimerIcon } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { ThemeSwitcher } from './custom/themeSwitcher'

// Menu items.
const items = [
  {
    title: `Freestyle`,
    url: '/freestyle',
    icon: BirdIcon,
  },
  // {
  //   title: `Routines`,
  //   url: '/routines',
  //   icon: Repeat2Icon,
  //   childrenRoutes: ['/routine/'],
  // },
]

export function AppSidebar() {
  const { setOpenMobile } = useSidebar()
  const pathname = usePathname() // Get the current route.

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="my-4">
            <SidebarTrigger className="-ml-2 mr-4 p-5" />
            <span className="w-full">Tokei 時計</span>
            <div className={cn('flex w-full flex-row justify-end gap-4')}>
              <div className="h-full w-fit pt-1.5">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonPopoverCard: { pointerEvents: 'initial' },
                    },
                  }}
                />
              </div>
              <ThemeSwitcher />
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-2">
              {items.map((item) => {
                const isActive =
                  pathname === item.url ||
                  item.childrenRoutes?.some((childRoute) =>
                    pathname.startsWith(childRoute),
                  )

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      variant={isActive ? 'outline' : 'default'}
                      className="p-6"
                    >
                      <Link
                        href={item.url}
                        onClick={() => {
                          setOpenMobile(false)
                        }}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className={cn('p-4')}>
        <Button variant={'outline'}>
          <Link href="https://github.com/harryt04/tokei/issues" target="_blank">
            Report a bug
          </Link>
        </Button>
        <Button variant={'outline'}>
          <Link href="https://github.com/harryt04/tokei" target="_blank">
            View source code
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
