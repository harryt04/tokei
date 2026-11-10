import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign in | Tokei 時計',
}

export default function SigninLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
