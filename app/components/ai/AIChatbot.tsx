'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, X, FileText, Calendar, Users, Briefcase, DollarSign } from 'lucide-react'
import { BASE_PATH } from '@/utils/url'

interface Message {
 role: 'user' | 'assistant'
 content: string
 timestamp: Date
 isTyping?: boolean
 intent?: string
 cached?: boolean
 tools_used?: any[]
}

const quickActions = [
 { icon: FileText, label: 'Tidsrapporter', path: '/reports', description: 'Se dina tidsrapporter' },
 { icon: Calendar, label: 'Kalender', path: '/calendar', description: 'Visa scheman' },
 { icon: Users, label: 'Anställda', path: '/employees', description: 'Hantera anställda' },
 { icon: Briefcase, label: 'Projekt', path: '/projects', description: 'Se alla projekt' },
 { icon: DollarSign, label: 'Fakturor', path: '/invoices', description: 'Hantera fakturor' },
]

// Initial message - defined outside component to avoid hydration issues
const getInitialMessage = (): Message => ({
 role: 'assistant',
 content: 'Hej! Jag är din AI-assistent för Frost. Jag har koll på dina projekt, tidsrapporter och fakturor.\n\nVad kan jag hjälpa dig med?',
 timestamp: new Date()
})

// Get current page context
function getPageContext(): string {
 if (typeof window === 'undefined') return ''
 const path = window.location.pathname
 if (path.includes('/projects')) return 'Användaren är på projektsidan'
 if (path.includes('/invoices')) return 'Användaren är på fakturasidan'
 if (path.includes('/reports')) return 'Användaren är på rapportsidan'
 if (path.includes('/calendar')) return 'Användaren är på kalendersidan'
 if (path.includes('/employees')) return 'Användaren är på anställdssidan'
 if (path.includes('/dashboard')) return 'Användaren är på dashboarden'
 return `Användaren är på ${path}`
}

export function AIChatbot() {
 const [isOpen, setIsOpen] = useState(false)
 const [messages, setMessages] = useState<Message[]>([])
 const [input, setInput] = useState('')
 const [isTyping, setIsTyping] = useState(false)
 const [streamingContent, setStreamingContent] = useState<string>('')
 const messagesEndRef = useRef<HTMLDivElement>(null)
 const abortControllerRef = useRef<AbortController | null>(null)
 const [conversationId, setConversationId] = useState<string | null>(null)

 // Initialize messages on client mount only
 useEffect(() => {
  if (messages.length === 0) {
   setMessages([getInitialMessage()])
  }
 }, [])

 // Scroll to bottom when messages change
 useEffect(() => {
  if (isOpen && messagesEndRef.current) {
   messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }
 }, [messages, isOpen, streamingContent])

 // Cleanup abort controller on unmount
 useEffect(() => {
  return () => {
   if (abortControllerRef.current) {
    abortControllerRef.current.abort()
   }
  }
 }, [])

 const handleQuickAction = (action: typeof quickActions[0]) => {
  const message: Message = {
   role: 'user',
   content: `Ta mig till ${action.label}`,
   timestamp: new Date()
  }
  setMessages(prev => [...prev, message])
  
  // Add assistant response and navigate
  setTimeout(() => {
   setMessages(prev => [...prev, {
    role: 'assistant',
    content: `Jag tar dig till ${action.label}. ${action.description}.`,
    timestamp: new Date()
   }])
   
   setTimeout(() => {
    window.location.href = `${BASE_PATH}${action.path}`
   }, 500)
  }, 300)
 }

 const handleSend = async () => {
  if (!input.trim() || isTyping) return

  const userMessage: Message = {
   role: 'user',
   content: input,
   timestamp: new Date()
  }
  setMessages(prev => [...prev, userMessage])
  const userInput = input
  setInput('')
  setIsTyping(true)
  setStreamingContent('')

  // Create abort controller for this request
  abortControllerRef.current = new AbortController()

  try {
   const response = await fetch(`${BASE_PATH}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     query: userInput,
     pageContext: getPageContext(),
     pageData: {},
     conversationId: conversationId || undefined, // Don't send null
     model: 'gpt-4'
    }),
    signal: abortControllerRef.current.signal
   })

   if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
   }

   // Check if this is a cached response (JSON) or streaming (SSE)
   const contentType = response.headers.get('content-type') || ''
   
   if (contentType.includes('application/json')) {
    // Cached response
    const data = await response.json()
    if (data.conversation_id) {
     setConversationId(data.conversation_id)
    }
    
    setMessages(prev => [...prev, {
     role: 'assistant',
     content: data.response || 'Inget svar genererat.',
     timestamp: new Date(),
     cached: data.cached
    }])
   } else {
    // Streaming response
    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let fullContent = ''

    while (true) {
     const { done, value } = await reader.read()
     if (done) break

     const chunk = decoder.decode(value)
     const lines = chunk.split('\n')

     for (const line of lines) {
      if (line.startsWith('data: ')) {
       const data = line.slice(6)
       if (data === '[DONE]') {
        // Stream complete
        continue
       }

       try {
        const parsed = JSON.parse(data)
        if (parsed.content) {
         fullContent += parsed.content
         setStreamingContent(fullContent)
        }
        if (parsed.error) {
         throw new Error(parsed.error)
        }
       } catch (e) {
        // Skip invalid JSON
       }
      }
     }
    }

    // Add the complete message
    if (fullContent) {
     setMessages(prev => [...prev, {
      role: 'assistant',
      content: fullContent,
      timestamp: new Date()
     }])
    }
   }
  } catch (error: any) {
   if (error.name === 'AbortError') {
    // User cancelled
    return
   }
   
   console.error('AI chat error:', error)
   setMessages(prev => [...prev, {
    role: 'assistant',
    content: 'Något gick fel. Försök igen om en stund.',
    timestamp: new Date()
   }])
  } finally {
   setIsTyping(false)
   setStreamingContent('')
   abortControllerRef.current = null
  }
 }

 return (
  <>
   {/* Floating button - always visible when chat is closed */}
   {!isOpen && (
    <div 
     className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[99999]" 
     style={{ 
      position: 'fixed', 
      zIndex: 99999,
      bottom: '16px',
      right: '16px',
      pointerEvents: 'auto'
     }}
    >
     <button
      onClick={(e) => {
       e.preventDefault()
       e.stopPropagation()
       setIsOpen(true)
      }}
      className="bg-primary-500 hover:bg-primary-600 text-white p-3 sm:p-4 rounded-full shadow-md hover:shadow-xl transition-all transform hover:scale-110 flex items-center justify-center gap-2 group"
      style={{
       pointerEvents: 'auto',
       cursor: 'pointer',
       zIndex: 99999
      }}
      aria-label="Öppna AI-assistent"
     >
      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-pulse" />
      <span className="hidden sm:inline text-sm sm:text-base font-semibold">AI Hjälp</span>
     </button>
    </div>
   )}

   {/* Chat window - only visible when open */}
   {isOpen && (
    <div 
     className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-full sm:max-w-md bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-8rem)] sm:h-[600px] max-h-[600px]"
     style={{ 
      position: 'fixed', 
      zIndex: 99999,
      bottom: '16px',
      right: '16px',
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection: 'column'
     }}
    >
     {/* Header */}
     <div 
      className="bg-primary-500 hover:bg-primary-600 text-white p-3 sm:p-4 rounded-t-xl sm:rounded-t-2xl flex items-center justify-between flex-shrink-0" 
      style={{ 
       flexShrink: 0,
       position: 'sticky',
       top: 0,
       zIndex: 10,
       backgroundColor: 'rgb(168, 85, 247)'
      }}
     >
      <div className="flex items-center gap-2">
       <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
       <h3 className="font-bold text-sm sm:text-base">AI Assistent</h3>
      </div>
      <button
       onClick={() => {
        setIsOpen(false)
        setStreamingContent('')
        if (abortControllerRef.current) {
         abortControllerRef.current.abort()
        }
       }}
       className="text-white hover:bg-white/20 transition-colors p-1.5 rounded-lg flex-shrink-0"
       aria-label="Stäng"
       style={{ 
        flexShrink: 0,
        minWidth: '32px',
        minHeight: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
       }}
      >
       <X className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
     </div>

     {/* Messages */}
     <div 
      className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4"
      style={{ 
       overflowY: 'auto',
       overflowX: 'hidden',
       minHeight: 0,
       flex: '1 1 auto'
      }}
     >
      {messages.map((msg, idx) => (
       <div
        key={idx}
        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
       >
        <div
         className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-2.5 sm:p-3 ${
          msg.role === 'user'
           ? 'bg-primary-500 text-white'
           : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
         }`}
        >
         <div className="flex items-start justify-between gap-2">
          <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed flex-1">{msg.content}</p>
          {msg.role === 'assistant' && (
           <div className="flex flex-col gap-1 flex-shrink-0">
            {msg.cached && (
             <span className="text-[10px] text-gray-500" title="Cached resultat">💾</span>
            )}
            <div className="flex gap-1">
             <button
              onClick={async (e) => {
               try {
                await fetch(`${BASE_PATH}/api/ai/feedback`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                  conversationId: conversationId,
                  messageId: msg.timestamp?.toString(),
                  rating: 'positive',
                  reason: 'User clicked thumbs up'
                 })
                })
                const btn = e.currentTarget as HTMLButtonElement
                if (btn) btn.style.opacity = '0.5'
               } catch (error) {
                console.error('Feedback error:', error)
               }
              }}
              className="text-[10px] hover:scale-110 transition-transform"
              title="Bra svar"
             >
              👍
             </button>
             <button
              onClick={async (e) => {
               try {
                await fetch(`${BASE_PATH}/api/ai/feedback`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                  conversationId: conversationId,
                  messageId: msg.timestamp?.toString(),
                  rating: 'negative',
                  reason: 'User clicked thumbs down'
                 })
                })
                const btn = e.currentTarget as HTMLButtonElement
                if (btn) btn.style.opacity = '0.5'
               } catch (error) {
                console.error('Feedback error:', error)
               }
              }}
              className="text-[10px] hover:scale-110 transition-transform"
              title="Dåligt svar"
             >
              👎
             </button>
            </div>
           </div>
          )}
         </div>
        </div>
       </div>
      ))}
      
      {/* Streaming content */}
      {(isTyping || streamingContent) && (
       <div className="flex justify-start">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2.5 sm:p-3 max-w-[85%] sm:max-w-[80%]">
         {streamingContent ? (
          <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed text-gray-900 dark:text-white">
           {streamingContent}
           <span className="inline-block w-2 h-4 bg-primary-500 ml-1 animate-pulse">|</span>
          </p>
         ) : (
          <div className="flex gap-1">
           <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
           <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
           <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
         )}
        </div>
       </div>
      )}
      <div ref={messagesEndRef} />
     </div>

     {/* Quick Actions */}
     {messages.length > 0 && (
      <div 
       className="border-t border-gray-200 dark:border-gray-700 p-2 sm:p-3 flex-shrink-0"
       style={{ flexShrink: 0 }}
      >
       <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
        {quickActions.slice(0, 3).map((action, idx) => {
         const Icon = action.icon
         return (
          <button
           key={idx}
           onClick={() => handleQuickAction(action)}
           disabled={isTyping}
           className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
           <Icon className="w-3 h-3" />
           <span className="hidden xs:inline">{action.label}</span>
          </button>
         )
        })}
       </div>
      </div>
     )}

     {/* Input */}
     <div 
      className="border-t border-gray-200 dark:border-gray-700 p-2 sm:p-4 flex-shrink-0"
      style={{ flexShrink: 0 }}
     >
      <div className="flex gap-2">
       <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && !isTyping && handleSend()}
        placeholder="Fråga mig något..."
        className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        disabled={isTyping}
       />
       <button
        onClick={handleSend}
        disabled={!input.trim() || isTyping}
        className="bg-primary-500 hover:bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
       >
        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
       </button>
      </div>
     </div>
    </div>
   )}
  </>
 )
}
