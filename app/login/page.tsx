import { LoginCard } from '@/components/custom/login-card'
import { cn } from '@/lib/utils'

export default function Login() {
  return (
    <div
      className={cn(
        'flex items-center justify-center align-center h-screen bg-background',
      )}
    >
      <LoginCard />
    </div>
  )
}
