import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign up | Tokei 時計',
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
