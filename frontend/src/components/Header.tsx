import { TrendingUp, LogOut, Menu } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  onToggleSidebar?: () => void
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, setUser } = useApp()
  const navigate = useNavigate()

  const handleLogout = () => {
    setUser(null)
    localStorage.clear()
    navigate('/login')
  }

  return (
    <header className="h-16 border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-[hsl(var(--color-primary))]" />
          <h1 className="text-xl font-bold text-[hsl(var(--color-foreground))]">
            MarketSight AI
          </h1>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Avatar>
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback>
                {user?.name?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm font-medium text-[hsl(var(--color-foreground))]">
              {user?.name}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-sm">
            <p className="font-medium text-[hsl(var(--color-foreground))]">{user?.name}</p>
            <p className="text-xs text-[hsl(var(--color-muted-foreground))]">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

