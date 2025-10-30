import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User, ResearchSession, Message, Source } from '../types/index.ts'

interface AppContextType {
  user: User | null
  setUser: (user: User | null) => void
  sessions: ResearchSession[]
  activeSessionId: string | null
  setActiveSessionId: (id: string | null) => void
  createSession: (title: string, ticker: string) => string
  deleteSession: (id: string) => void
  updateSessionTitle: (id: string, title: string) => void
  addMessage: (sessionId: string, message: Omit<Message, 'id' | 'timestamp'>) => string
  updateMessage: (sessionId: string, messageId: string, updates: Partial<Message>) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [sessions, setSessions] = useState<ResearchSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedSessions = localStorage.getItem('sessions')
    const storedActiveSession = localStorage.getItem('activeSessionId')
    
    if (storedUser) setUser(JSON.parse(storedUser))
    if (storedSessions) {
      const parsed = JSON.parse(storedSessions)
      // Convert date strings back to Date objects
      const sessionsWithDates = parsed.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        messages: s.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      }))
      setSessions(sessionsWithDates)
    }
    if (storedActiveSession) setActiveSessionId(storedActiveSession)
  }, [])

  // Save to localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  }, [user])

  // Save to localStorage when sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('sessions', JSON.stringify(sessions))
    }
  }, [sessions])

  // Save to localStorage when activeSessionId changes
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem('activeSessionId', activeSessionId)
    } else {
      localStorage.removeItem('activeSessionId')
    }
  }, [activeSessionId])

  const createSession = (title: string, ticker: string): string => {
    const newSession: ResearchSession = {
      id: crypto.randomUUID(),
      title,
      ticker: ticker.toUpperCase(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setSessions(prev => [newSession, ...prev])
    setActiveSessionId(newSession.id)
    return newSession.id
  }

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    if (activeSessionId === id) {
      setActiveSessionId(null)
    }
  }

  const updateSessionTitle = (id: string, title: string) => {
    setSessions(prev => prev.map(s => 
      s.id === id ? { ...s, title, updatedAt: new Date() } : s
    ))
  }

  const addMessage = (sessionId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }
    
    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { ...s, messages: [...s.messages, newMessage], updatedAt: new Date() }
        : s
    ))
    return newMessage.id
  }

  const updateMessage = (sessionId: string, messageId: string, updates: Partial<Message>) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { 
            ...s, 
            messages: s.messages.map(m => 
              m.id === messageId ? { ...m, ...updates } : m
            ),
            updatedAt: new Date()
          }
        : s
    ))
  }

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      sessions,
      activeSessionId,
      setActiveSessionId,
      createSession,
      deleteSession,
      updateSessionTitle,
      addMessage,
      updateMessage,
    }}>
      {children}
    </AppContext.Provider>
  )
}

