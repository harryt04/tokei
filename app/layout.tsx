import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { Inter as FontSans } from 'next/font/google'

import './globals.css'

import { cn } from '@/lib/utils'
import { PostHogProvider } from '@/providers/posthogProvider'
import { ThemeProvider } from '@/providers/themeProvider'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Tokei',
  description:
    'Tokei is the ultimate timer app for power users, designed for chefs in the kitchen, fitness instructors, and project managers who need to set precise, sequential routines to keep everything on track.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <ClerkProvider>
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
              {children}
            </ThemeProvider>
          </body>
        </PostHogProvider>
      </ClerkProvider>
    </html>
  )
}
