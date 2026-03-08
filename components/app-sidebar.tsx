'use client'

import { usePathname } from 'next/navigation'
import { BirdIcon, LogOutIcon, Repeat2Icon } from 'lucide-react'
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
import { authClient } from '@/lib/auth-client'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { ThemeSwitcher } from './custom/theme-switcher'
import { Badge } from './ui/badge'
import { useRouter } from 'next/navigation'

// Menu items.
const items = [
  {
    title: `Freestyle`,
    url: '/freestyle',
    icon: BirdIcon,
  },
  {
    title: `Routines`,
    beta: true,
    url: '/routines',
    icon: Repeat2Icon,
    childrenRoutes: ['/routine/'],
  },
]

export function AppSidebar() {
  const { setOpenMobile } = useSidebar()
  const pathname = usePathname() // Get the current route.
  const { data: session } = authClient.useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/')
        },
      },
    })
  }

  const userInitials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="my-4">
            <SidebarTrigger className="-ml-2 mr-4 p-5" />
            <span className="w-full">Tokei 時計</span>
            <div className={cn('flex w-full flex-row justify-end gap-4')}>
              <ThemeSwitcher />
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-2">
              {items.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item as any).childrenRoutes?.some((childRoute) =>
                    pathname?.startsWith(childRoute),
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
                        {item.beta && <Badge>Beta</Badge>}
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
        {session?.user && (
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                {userInitials}
              </div>
              <span className="truncate text-sm">
                {session.user.name || session.user.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOutIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
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
