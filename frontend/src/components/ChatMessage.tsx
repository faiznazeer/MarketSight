import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronUp, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Message } from '../types/index.ts'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: Message
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [showSources, setShowSources] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("flex gap-4 mb-6", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[hsl(var(--color-primary))] flex items-center justify-center">
          <Bot className="h-5 w-5 text-[hsl(var(--color-primary-foreground))]" />
        </div>
      )}

      <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start", "max-w-[80%]")}>
        <div
          className={cn(
            "rounded-lg px-4 py-3",
            isUser
              ? "bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))]"
              : "bg-[hsl(var(--color-secondary))] text-[hsl(var(--color-foreground))]"
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full divide-y divide-[hsl(var(--color-border))]">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--color-muted-foreground))] uppercase tracking-wider bg-[hsl(var(--color-muted))]">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2 text-sm text-[hsl(var(--color-foreground))] border-t border-[hsl(var(--color-border))]">
                      {children}
                    </td>
                  ),
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '')
                    return match ? (
                      <pre className="bg-[hsl(var(--color-background))] rounded-md p-4 overflow-x-auto my-2">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code className="bg-[hsl(var(--color-muted))] rounded px-1.5 py-0.5 text-sm" {...props}>
                        {children}
                      </code>
                    )
                  },
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-2 first:mt-0">{children}</h3>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[hsl(var(--color-primary))] hover:underline"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {message.isStreaming && !isUser && (
            <span className="inline-flex items-center gap-1 mt-2">
              <span className="w-2 h-2 bg-[hsl(var(--color-primary))] rounded-full animate-pulse"></span>
              <span className="w-2 h-2 bg-[hsl(var(--color-primary))] rounded-full animate-pulse delay-75"></span>
              <span className="w-2 h-2 bg-[hsl(var(--color-primary))] rounded-full animate-pulse delay-150"></span>
            </span>
          )}
        </div>

        {!isUser && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 text-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </Button>

            {message.sources && message.sources.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSources(!showSources)}
                className="h-8 text-xs"
              >
                {showSources ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Hide Sources
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    View Sources ({message.sources.length})
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {!isUser && showSources && message.sources && message.sources.length > 0 && (
          <div className="w-full space-y-2">
            {message.sources.map((source) => (
              <div
                key={source.id}
                className="bg-[hsl(var(--color-muted))] rounded-md p-3 text-sm border border-[hsl(var(--color-border))]"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-[hsl(var(--color-foreground))]">{source.title}</p>
                  {source.page && (
                    <span className="text-xs bg-[hsl(var(--color-secondary))] px-2 py-1 rounded text-[hsl(var(--color-muted-foreground))]">
                      Page {source.page}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[hsl(var(--color-muted-foreground))] italic">
                  "{source.snippet}"
                </p>
                {source.documentType && (
                  <p className="text-xs text-[hsl(var(--color-muted-foreground))] mt-2">
                    Source: {source.documentType}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[hsl(var(--color-secondary))] flex items-center justify-center">
          <User className="h-5 w-5 text-[hsl(var(--color-foreground))]" />
        </div>
      )}
    </div>
  )
}

