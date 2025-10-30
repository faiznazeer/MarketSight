import { Plus, MoreVertical, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const { sessions, activeSessionId, setActiveSessionId, createSession, deleteSession, updateSessionTitle } = useApp()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newTicker, setNewTicker] = useState('')

  const handleNewChat = () => {
    setIsCreating(true)
  }

  const handleCreateSession = () => {
    if (newTitle.trim() && newTicker.trim()) {
      createSession(newTitle.trim(), newTicker.trim())
      setNewTitle('')
      setNewTicker('')
      setIsCreating(false)
    }
  }

  const handleCancelCreate = () => {
    setIsCreating(false)
    setNewTitle('')
    setNewTicker('')
  }

  const handleStartEdit = (id: string, currentTitle: string) => {
    setEditingId(id)
    setEditTitle(currentTitle)
  }

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      updateSessionTitle(editingId, editTitle.trim())
      setEditingId(null)
      setEditTitle('')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const handleDelete = (id: string) => {
    deleteSession(id)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative inset-y-0 left-0 z-50 w-80 bg-[hsl(var(--color-card))] border-r border-[hsl(var(--color-border))] flex flex-col transition-transform duration-300 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-[hsl(var(--color-border))] flex items-center justify-between">
          <h2 className="font-semibold text-[hsl(var(--color-foreground))]">Research Sessions</h2>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="p-4">
          {isCreating ? (
            <div className="space-y-2 p-3 bg-[hsl(var(--color-secondary))] rounded-md">
              <Input
                placeholder="Session title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
                autoFocus
              />
              <Input
                placeholder="Ticker (e.g., AAPL)"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateSession} className="flex-1">
                  Create
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelCreate}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={handleNewChat} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group relative rounded-md mb-1 transition-colors cursor-pointer",
                activeSessionId === session.id
                  ? "bg-[hsl(var(--color-accent))]"
                  : "hover:bg-[hsl(var(--color-accent))]"
              )}
            >
              {editingId === session.id ? (
                <div className="p-3 space-y-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit()
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit} className="flex-1">
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="p-3 flex items-start justify-between"
                  onClick={() => setActiveSessionId(session.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-[hsl(var(--color-secondary))] px-2 py-0.5 rounded text-[hsl(var(--color-primary))]">
                        {session.ticker}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[hsl(var(--color-foreground))] mt-1 truncate">
                      {session.title}
                    </p>
                    <p className="text-xs text-[hsl(var(--color-muted-foreground))] mt-1">
                      {session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartEdit(session.id, session.title)
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(session.id)
                        }}
                        className="text-[hsl(var(--color-destructive))]"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))}

          {sessions.length === 0 && !isCreating && (
            <div className="text-center py-8 text-sm text-[hsl(var(--color-muted-foreground))]">
              No sessions yet. Create your first chat to get started!
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

