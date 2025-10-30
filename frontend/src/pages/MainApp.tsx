import { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import ChatWindow from '@/components/ChatWindow'

export default function MainApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-screen flex flex-col bg-[hsl(var(--color-background))]">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <ChatWindow />
      </div>
    </div>
  )
}

