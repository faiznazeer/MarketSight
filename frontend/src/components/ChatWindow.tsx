import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useApp } from '@/context/AppContext'
import ChatMessage from './ChatMessage'
import type { Source } from '../types/index.ts'

const EXAMPLE_PROMPTS = [
  "Summarize the risk factors for $TSLA",
  "What was Microsoft's revenue in the last fiscal year?",
  "Compare Apple's and Google's R&D spending",
  "What are the key highlights from Amazon's latest 10-K?",
]

export default function ChatWindow() {
  const { sessions, activeSessionId, addMessage, updateMessage } = useApp()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeSession = sessions.find(s => s.id === activeSessionId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [activeSession?.messages])

  const simulateStreamingResponse = async (userMessage: string, sessionId: string) => {
    // Mock AI response with streaming effect
    const mockResponse = `Based on the financial documents, here's what I found:

## Key Findings

The company has shown **strong revenue growth** of approximately 23% year-over-year. Here are the highlights:

- Revenue: $394.3 billion
- Net Income: $96.9 billion
- Operating Margin: 30.7%

### Revenue Breakdown by Segment

| Segment | Revenue (B) | YoY Growth |
|---------|-------------|------------|
| Products | $298.1 | +7% |
| Services | $78.1 | +14% |
| Other | $18.1 | +5% |

The company continues to invest heavily in R&D, with spending reaching $26.3 billion this year. This represents about 6.7% of total revenue.

### Risk Factors

Key risks identified in the 10-K include:
1. Supply chain vulnerabilities
2. Regulatory challenges in key markets
3. Competition from emerging technologies
4. Currency fluctuation impacts

The management team has expressed confidence in their strategic initiatives and expects continued growth in the coming quarters.`

    // Create assistant message
    const assistantMessageId = crypto.randomUUID()
    
    // Mock sources
    const mockSources: Source[] = [
      {
        id: '1',
        title: '10-K Annual Report - Item 7: Management Discussion',
        snippet: 'The company has shown strong revenue growth of approximately 23% year-over-year, driven primarily by increased product sales and service subscriptions.',
        page: 42,
        documentType: '10-K Filing'
      },
      {
        id: '2',
        title: '10-K Annual Report - Item 1A: Risk Factors',
        snippet: 'The company faces risks related to supply chain vulnerabilities, regulatory challenges in key markets, and competition from emerging technologies.',
        page: 15,
        documentType: '10-K Filing'
      },
      {
        id: '3',
        title: '10-K Annual Report - Consolidated Financial Statements',
        snippet: 'Revenue for the year reached $394.3 billion with net income of $96.9 billion, representing an operating margin of 30.7%.',
        page: 67,
        documentType: '10-K Filing'
      }
    ]

    addMessage(sessionId, {
      role: 'assistant',
      content: '',
      isStreaming: true,
      sources: mockSources
    })

    // Simulate streaming
    const words = mockResponse.split(' ')
    let currentContent = ''

    for (let i = 0; i < words.length; i++) {
      currentContent += (i > 0 ? ' ' : '') + words[i]
      
      updateMessage(sessionId, assistantMessageId, {
        content: currentContent,
        isStreaming: i < words.length - 1
      })

      // Wait a bit between words to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 30))
    }

    updateMessage(sessionId, assistantMessageId, {
      content: mockResponse,
      isStreaming: false
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || !activeSessionId || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // Add user message
    addMessage(activeSessionId, {
      role: 'user',
      content: userMessage
    })

    // Simulate AI response
    await simulateStreamingResponse(userMessage, activeSessionId)
    
    setIsLoading(false)
  }

  const handleExampleClick = (prompt: string) => {
    setInput(prompt)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  if (!activeSession) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-2xl">
          <Sparkles className="h-16 w-16 text-[hsl(var(--color-primary))] mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-[hsl(var(--color-foreground))] mb-4">
            Welcome to MarketSight AI
          </h2>
          <p className="text-[hsl(var(--color-muted-foreground))] mb-8">
            Your AI-powered financial research assistant. Ask complex questions about public companies,
            and get answers synthesized from official financial documents like 10-K reports.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {EXAMPLE_PROMPTS.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(prompt)}
                className="text-left p-4 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] hover:bg-[hsl(var(--color-accent))] transition-colors text-sm text-[hsl(var(--color-foreground))]"
              >
                {prompt}
              </button>
            ))}
          </div>

          <p className="text-sm text-[hsl(var(--color-muted-foreground))]">
            Create a new chat session from the sidebar to get started
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {activeSession.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-2xl">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-[hsl(var(--color-secondary))] rounded-full">
                <span className="text-xs font-mono text-[hsl(var(--color-primary))]">
                  {activeSession.ticker}
                </span>
                <span className="text-sm text-[hsl(var(--color-foreground))]">
                  {activeSession.title}
                </span>
              </div>
              <p className="text-[hsl(var(--color-muted-foreground))] mb-6">
                Start your research by asking a question
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EXAMPLE_PROMPTS.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(prompt)}
                    className="text-left p-3 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] hover:bg-[hsl(var(--color-accent))] transition-colors text-sm text-[hsl(var(--color-foreground))]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {activeSession.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeSession
                  ? `Ask a question about ${activeSession.ticker}...`
                  : "Select a session to start chatting..."
              }
              disabled={!activeSession || isLoading}
              className="min-h-[60px] max-h-[200px] resize-none"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || !activeSession || isLoading}
              className="h-[60px] w-[60px] flex-shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-xs text-[hsl(var(--color-muted-foreground))] mt-2 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </form>
      </div>
    </div>
  )
}

