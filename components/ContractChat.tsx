'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageCircle, Send, User, Bot, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  referenced_clauses?: any[]
  metadata?: {
    confidence?: number
    sources?: string[]
  }
  created_at: string
}

interface ContractChatProps {
  contractId: string
  contractTitle: string
}

export default function ContractChat({ contractId, contractTitle }: ContractChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadChatHistory()
  }, [contractId])

  const loadChatHistory = async () => {
    try {
      setIsInitialLoading(true)
      const response = await fetch(`/api/contracts/${contractId}/chat`)
      
      if (!response.ok) {
        throw new Error('Failed to load chat history')
      }

      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error loading chat history:', error)
      toast.error('Failed to load chat history')
    } finally {
      setIsInitialLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return

    const messageText = newMessage.trim()
    setNewMessage('')
    setIsLoading(true)

    try {
      const response = await fetch(`/api/contracts/${contractId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      // Add both user and assistant messages
      setMessages(prev => [
        ...prev,
        data.userMessage,
        data.assistantMessage
      ])
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
      // Re-add the message to input if it failed
      setNewMessage(messageText)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  if (isInitialLoading) {
    return (
      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Contract Discussion
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading chat history...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          Contract Discussion
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ask questions about "{contractTitle}" and get AI-powered insights
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">Start a conversation</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Ask questions about your contract, specific clauses, risks, or get clarification on legal terms.
                </p>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p>Example questions:</p>
                  <ul className="text-xs space-y-1">
                    <li>• "What are the termination conditions?"</li>
                    <li>• "Are there any high-risk clauses I should be aware of?"</li>
                    <li>• "What happens if I breach this contract?"</li>
                  </ul>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm">
                      {formatMessage(message.content)}
                    </div>
                    
                    {message.role === 'assistant' && message.referenced_clauses && message.referenced_clauses.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs font-medium mb-1">Referenced sections:</p>
                        <div className="space-y-1">
                          {message.referenced_clauses.map((clause, index) => (
                            <div key={index} className="text-xs bg-background/50 rounded p-2">
                              <p className="font-medium">{clause.section}</p>
                              <p className="text-muted-foreground">{clause.relevance}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {message.role === 'assistant' && message.metadata?.confidence && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Confidence: {Math.round(message.metadata.confidence * 100)}%
                      </div>
                    )}
                  </div>
                  
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing your question...
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about this contract..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}