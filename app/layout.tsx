import type { Metadata } from 'next'
import { Inter as FontSans } from 'next/font/google'

import './globals.css'

import { cn } from '@/lib/utils'
import { PostHogProvider } from '@/providers/posthogProvider'
import { ThemeProvider } from '@/providers/themeProvider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AuthSidebar } from '@/components/custom/auth-sidebar'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Tokei 時計',
  description: `Tokei (時計, meaning 'clock' in Japanese) is a free, open-source timer app built for power users. Designed specifically for chefs in the kitchen, it helps manage multiple timers simultaneously, ensuring all dishes are finished at the perfect moment.`,
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <PostHogProvider>
        <body
          suppressHydrationWarning={true}
          className={cn(
            'min-h-screen bg-background font-sans antialiased',
            fontSans.variable,
          )}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              <AuthSidebar />
              {children}
            </SidebarProvider>
          </ThemeProvider>
        </body>
      </PostHogProvider>
    </html>
  )
}
