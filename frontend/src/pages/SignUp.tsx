import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/context/AppContext'
import { TrendingUp, Mail } from 'lucide-react'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { setUser } = useApp()
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mock signup - in production, this would call your auth API
    const mockUser = {
      id: crypto.randomUUID(),
      name: name,
      email: email,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`
    }
    
    setUser(mockUser)
    navigate('/app')
  }

  const handleGoogleSignup = () => {
    // Mock Google OAuth - in production, this would redirect to OAuth
    const mockUser = {
      id: crypto.randomUUID(),
      name: 'Demo User',
      email: 'demo@marketsight.ai',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Demo User'
    }
    
    setUser(mockUser)
    navigate('/app')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--color-background))] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="h-8 w-8 text-[hsl(var(--color-primary))]" />
            <h1 className="text-3xl font-bold text-[hsl(var(--color-foreground))]">
              MarketSight AI
            </h1>
          </div>
          <p className="text-[hsl(var(--color-muted-foreground))]">
            Create your account to start researching with AI
          </p>
        </div>

        <div className="bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-lg p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2 text-[hsl(var(--color-foreground))]">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-[hsl(var(--color-foreground))]">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-[hsl(var(--color-foreground))]">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Create Account
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[hsl(var(--color-border))]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[hsl(var(--color-card))] text-[hsl(var(--color-muted-foreground))]">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleSignup}
          >
            <Mail className="h-4 w-4" />
            Sign up with Google
          </Button>

          <p className="mt-6 text-center text-sm text-[hsl(var(--color-muted-foreground))]">
            Already have an account?{' '}
            <Link to="/login" className="text-[hsl(var(--color-primary))] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

