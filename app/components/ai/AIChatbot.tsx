'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, X, FileText, Calendar, Users, Briefcase, DollarSign } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean // For typing animation
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
  content: 'Hej! Jag är din AI-assistent. Jag kan hjälpa dig att:\n\n• Hitta rätt sida i appen\n• Sammanfatta tidsrapporter\n• Förklara funktioner\n• Ge tips om hur du använder systemet\n\nVad kan jag hjälpa dig med?',
  timestamp: new Date()
})

export function AIChatbot() {
  // ALL hooks must be declared at the top, in the same order every render
  // Never add conditional hooks or early returns before all hooks!
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingMessage, setTypingMessage] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)

  // Initialize messages on client mount only
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🤖 AIChatbot: Component mounted, isOpen:', isOpen)
    }
    if (messages.length === 0) {
      setMessages([getInitialMessage()])
    }
  }, []) // Empty deps - only run once on mount

  // Debug: Log when isOpen changes (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🤖 AIChatbot: isOpen changed to:', isOpen)
    }
  }, [isOpen])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, typingMessage])

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // Typing effect - writes text word by word
  const typeMessage = (fullText: string, onComplete: () => void) => {
    const words = fullText.split(' ')
    let currentIndex = 0
    setTypingMessage('')
    setIsTyping(true)

    const typeNextWord = () => {
      if (currentIndex < words.length) {
        setTypingMessage(prev => {
          const newText = prev ? `${prev} ${words[currentIndex]}` : words[currentIndex]
          return newText
        })
        currentIndex++
        // Random delay between 30-80ms per word for natural typing
        const delay = 30 + Math.random() * 50
        typingTimeoutRef.current = setTimeout(typeNextWord, delay)
      } else {
        setIsTyping(false)
        onComplete()
      }
    }

    typeNextWord()
  }

  const handleQuickAction = (action: typeof quickActions[0]) => {
    const message: Message = {
      role: 'user',
      content: `Ta mig till ${action.label}`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
    
    setTimeout(() => {
      const responseText = `Jag tar dig till ${action.label}. ${action.description}.`
      typeMessage(responseText, () => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: responseText,
          timestamp: new Date()
        }])
        setTypingMessage('')
        
        // Navigate after message is complete
        setTimeout(() => {
          window.location.href = action.path
        }, 300)
      })
    }, 300)
  }

  const handleSummarizeReports = () => {
    const message: Message = {
      role: 'user',
      content: 'Sammanfatta mina tidsrapporter',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
    setIsTyping(true)
    setTypingMessage('')

    // Fetch time entries
    fetch('/api/time-entries/list')
      .then(res => res.json())
      .then(data => {
        const entries = data.entries || []
        const totalHours = entries.reduce((sum: number, e: any) => sum + (Number(e.hours_total) || 0), 0)
        const thisMonth = entries.filter((e: any) => {
          const date = new Date(e.date || e.created_at)
          const now = new Date()
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        })
        const monthHours = thisMonth.reduce((sum: number, e: any) => sum + (Number(e.hours_total) || 0), 0)

        const summaryText = `Här är en sammanfattning av dina tidsrapporter:\n\n` +
          `📊 Totalt rapporterade timmar: ${totalHours.toFixed(1)}h\n` +
          `📅 Denna månad: ${monthHours.toFixed(1)}h\n` +
          `📝 Antal rapporter: ${entries.length}\n\n` +
          `Vill du se mer detaljer? Gå till "Rapporter" i menyn.`

        typeMessage(summaryText, () => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: summaryText,
            timestamp: new Date()
          }])
          setTypingMessage('')
        })
      })
      .catch(() => {
        const errorText = 'Kunde inte hämta tidsrapporter just nu. Försök igen senare eller gå till "Rapporter" i menyn.'
        typeMessage(errorText, () => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: errorText,
            timestamp: new Date()
          }])
          setTypingMessage('')
        })
      })
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
    setTypingMessage('')

    // Try new AI chat API first, fallback to keyword-based
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          conversationId: conversationId
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update conversation ID if provided
        if (data.conversation_id) {
          setConversationId(data.conversation_id)
        }

        // Type out the response
        typeMessage(data.response || 'Inget svar genererat.', () => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
            intent: data.intent,
            cached: data.cached,
            tools_used: data.tools_used
          }])
          setTypingMessage('')
        })
        return
      }
    } catch (error) {
      console.error('AI chat API error:', error)
      // Fall through to keyword-based fallback
    }

    // Fallback to keyword-based responses
    setTimeout(async () => {
      const lowerInput = userInput.toLowerCase().trim()
      // Normalize: remove extra spaces, handle common typos
      const normalized = lowerInput.replace(/\s+/g, ' ').replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o')
      let response = ''

      // Helper function for flexible matching
      const matches = (...keywords: string[]) => {
        return keywords.some(keyword => {
          const normalizedKeyword = keyword.toLowerCase().replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o')
          return normalized.includes(normalizedKeyword) || lowerInput.includes(keyword.toLowerCase())
        })
      }

      // Greetings
      if (lowerInput.match(/^(hej|hello|hi|tjena|tja|hallå|hejsan)$/)) {
        response = 'Hej! 👋\n\nJag är din AI-assistent. Jag kan hjälpa dig med:\n\n• Se dina schemalagda pass\n• Sammanfatta tidsrapporter\n• Hitta rätt sida i appen\n• Förklara funktioner\n• Ge tips\n\nVad kan jag hjälpa dig med idag?'
      }
      // Schedule queries
      else if (matches('pass', 'schema', 'veckan', 'schemalagt', 'schedule', 'schemalagd', 'schemalagda')) {
        try {
          // Get current week dates
          const today = new Date()
          const startOfWeek = new Date(today)
          startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday
          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(startOfWeek.getDate() + 6) // Sunday

          const startDate = startOfWeek.toISOString().split('T')[0]
          const endDate = endOfWeek.toISOString().split('T')[0]

          const res = await fetch(`/api/schedules?start_date=${startDate}&end_date=${endDate}`)
          if (res.ok) {
            const schedules = await res.json()
            if (schedules && schedules.length > 0) {
              const scheduleList = schedules
                .slice(0, 10)
                .map((s: any) => {
                  const date = new Date(s.start_time)
                  const time = date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
                  const day = date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })
                  return `• ${day} kl ${time}`
                })
                .join('\n')
              
              response = `Här är dina schemalagda pass denna vecka:\n\n${scheduleList}\n\n${schedules.length > 10 ? `...och ${schedules.length - 10} fler pass. ` : ''}För att se alla pass, gå till "Kalender" i menyn.`
            } else {
              response = 'Du har inga schemalagda pass denna vecka. 📅\n\nFör att se alla scheman eller skapa nya pass, gå till "Kalender" i menyn.'
            }
          } else {
            response = 'Jag kunde inte hämta dina scheman just nu. Försök gå till "Kalender" i menyn för att se alla pass.'
          }
        } catch (error) {
          response = 'Jag kunde inte hämta dina scheman just nu. Försök gå till "Kalender" i menyn för att se alla pass.'
        }
      }
      // Time reporting / Summarize reports
      else if (matches('sammanfatta', 'sammanfattning', 'sammanfatt', 'summarize', 'översikt', 'översik') && 
               (matches('tidsrapport', 'rapport', 'tim', 'tid', 'stämpl', 'klocka') || lowerInput.includes('mina') || lowerInput.includes('min'))) {
        try {
          // Get current month dates
          const today = new Date()
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

          const startDate = startOfMonth.toISOString().split('T')[0]
          const endDate = endOfMonth.toISOString().split('T')[0]

          const res = await fetch(`/api/time-entries/list?start_date=${startDate}&end_date=${endDate}`)
          if (res.ok) {
            const data = await res.json()
            const entries = data.timeEntries || data.entries || data || []
            
            if (entries.length > 0) {
              const totalHours = entries.reduce((sum: number, entry: any) => {
                const hours = parseFloat(entry.hours || entry.total_hours || 0)
                return sum + hours
              }, 0)
              
              const thisMonthHours = totalHours.toFixed(1)
              const reportCount = entries.length
              
              response = `Här är en sammanfattning av dina tidsrapporter:\n\n📊 Totalt rapporterade timmar: ${thisMonthHours}h\n📅 Denna månad: ${thisMonthHours}h\n📝 Antal rapporter: ${reportCount}\n\nVill du se mer detaljer? Gå till "Rapporter" i menyn.`
            } else {
              response = 'Du har inga tidsrapporter denna månad ännu. 📅\n\nFör att rapportera tid:\n1. ⏰ Använd stämpelklockan på dashboarden\n2. 📝 Gå till "Rapporter" → "Ny tidsrapport"'
            }
          } else {
            response = 'Jag kunde inte hämta dina tidsrapporter just nu. Försök gå till "Rapporter" i menyn för att se alla rapporter.'
          }
        } catch (error) {
          response = 'Jag kunde inte hämta dina tidsrapporter just nu. Försök gå till "Rapporter" i menyn för att se alla rapporter.'
        }
      }
      // Time reporting (general)
      else if (matches('tidsrapport', 'rapportera', 'stämpla', 'stämpl', 'klocka', 'timrapport')) {
        response = 'För att rapportera tid kan du:\n\n1. ⏰ Använda stämpelklockan på dashboarden (snabbast!)\n2. 📝 Gå till "Rapporter" → "Ny tidsrapport"\n3. 📊 Använd "Sammanfatta mina tidsrapporter" knappen här för att se en översikt\n\nTips: Stämpelklockan skapar automatiskt tidsrapporter när du stämplar in och ut!'
      }
      // Projects
      else if (matches('projekt', 'project')) {
        response = 'Projekt hittar du under "Projekt" i menyn. Där kan du:\n\n• 📋 Se alla projekt\n• ➕ Skapa nya projekt\n• 📊 Se projektstatus och budget\n• 🤖 Använda AI-funktioner för budgetprognos och planering\n• 📸 Identifiera material från foto med AI'
      }
      // Invoices
      else if (matches('faktura', 'fakturor', 'invoice', 'fakturer')) {
        response = 'Fakturor hittar du under "Fakturor" i menyn. Där kan du:\n\n• 📄 Skapa fakturor från projekt\n• 📋 Se alla fakturor\n• 🤖 Använda AI för faktureringsförslag\n• 🔗 Exportera till Fortnox eller Visma\n• 💰 Se obetalda fakturor'
      }
      // Calendar/Schedule
      else if (matches('kalender', 'calendar', 'schema', 'schedule')) {
        response = 'Kalender hittar du under "Kalender" i menyn. Där kan du:\n\n• 📅 Se alla schemalagda pass\n• ➕ Skapa nya scheman\n• 👥 Se scheman för alla anställda\n• ⚠️ Se konflikter och frånvaro'
      }
      // Payroll
      else if (matches('lön', 'lönespec', 'lönespecifikation', 'payroll', 'salary')) {
        response = 'Lönespecifikationer hittar du under "Rapporter" → "Lönespec" eller klicka på din användare i menyn. Där kan du:\n\n• 💰 Se din lönespecifikation\n• 📥 Exportera som PDF\n• 📊 Se historik'
      }
      // Bug reporting
      else if (matches('bugg', 'fel', 'problem', 'error', 'bug', 'rapportera bugg', 'buggrapport')) {
        response = 'För att rapportera en bugg:\n\n1. 📝 Gå till "Feedback" i menyn\n2. Välj typen av feedback (bugg, förbättring, etc.)\n3. Beskriv problemet så detaljerat som möjligt\n4. Skicka in\n\nTips: Ta en skärmdump om möjligt - det hjälper oss att förstå problemet bättre!'
      }
      // Help
      else if (matches('hjälp', 'help', 'vad kan du', 'vad kan', 'assist', 'stöd')) {
        response = 'Jag kan hjälpa dig med:\n\n• 📅 Se dina schemalagda pass\n• 📊 Sammanfatta tidsrapporter\n• 🗺️ Hitta rätt sida i appen\n• 📖 Förklara funktioner\n• 💡 Ge tips\n• 🐛 Hjälpa med buggrapportering\n\nAnvänd snabbknapparna nedan eller fråga mig något specifikt!'
      }
      // Default - more helpful
      else {
        response = `Jag förstår att du frågar om "${userInput}".\n\nJag kan hjälpa dig med:\n\n• 📅 Scheman och pass - fråga "Vad för pass har jag denna vecka?"\n• 📊 Tidsrapporter - fråga om tidsrapportering\n• 🗺️ Navigation - fråga var du hittar något\n• 🐛 Buggrapportering - fråga "Hjälp mig buggrappotera"\n\nFör mer avancerad hjälp:\n• Gå till "FAQ" i menyn för vanliga frågor\n• Gå till "Feedback" för att rapportera problem\n• Använd snabbknapparna nedan`
      }

      typeMessage(response, () => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response,
          timestamp: new Date()
        }])
        setTypingMessage('')
      })
    }, 300)
  }

  // Always render button, but position it differently when chat is open
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
              if (process.env.NODE_ENV === 'development') {
                console.log('🤖 AIChatbot: Button clicked, opening chat, current isOpen:', isOpen)
              }
              setIsOpen(true)
            }}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 flex items-center justify-center gap-2 group"
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
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-8rem)] sm:h-[600px] max-h-[600px]"
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
      {/* Header - Always visible, fixed at top */}
      <div 
        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-3 sm:p-4 rounded-t-xl sm:rounded-t-2xl flex items-center justify-between flex-shrink-0" 
        style={{ 
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'rgb(168, 85, 247)' // purple-500 fallback
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          <h3 className="font-bold text-sm sm:text-base">AI Assistent</h3>
        </div>
        <button
          onClick={() => {
            setIsOpen(false)
            setTypingMessage('')
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current)
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

      {/* Messages - Scrollable area */}
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
                  ? 'bg-purple-500 text-white'
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
                            await fetch('/api/ai/feedback', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                conversationId: conversationId,
                                messageId: msg.timestamp?.toString(), // Use timestamp as ID for now
                                rating: 'positive',
                                reason: 'User clicked thumbs up'
                              })
                            })
                            // Visual feedback
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
                            await fetch('/api/ai/feedback', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                conversationId: conversationId,
                                messageId: msg.timestamp?.toString(),
                                rating: 'negative',
                                reason: 'User clicked thumbs down'
                              })
                            })
                            // Visual feedback
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
        
        {/* Typing indicator with animated text */}
        {(isTyping || typingMessage) && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2.5 sm:p-3 max-w-[85%] sm:max-w-[80%]">
              {typingMessage ? (
                <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed text-gray-900 dark:text-white">
                  {typingMessage}
                  <span className="inline-block w-2 h-4 bg-purple-500 ml-1 animate-pulse">|</span>
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

      {/* Quick Actions / Suggested Commands */}
      {messages.length > 1 && (
        <div 
          className="border-t border-gray-200 dark:border-gray-700 p-2 sm:p-3 flex-shrink-0"
          style={{ flexShrink: 0 }}
        >
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            {/* Generate suggested commands based on last intent */}
            {(() => {
              const lastMessage = messages[messages.length - 1]
              const intent = lastMessage.intent
              
              // Suggested commands based on intent
              const suggestions: Array<{ label: string; action: () => void; icon: any }> = []
              
              if (intent === 'time' || intent === 'general' || !intent) {
                suggestions.push({
                  label: 'Sammanfatta',
                  action: () => {
                    setInput('sammanfatta mina tidsrapporter')
                    setTimeout(() => handleSend(), 100)
                  },
                  icon: FileText
                })
              }
              
              if (intent === 'invoice' || intent === 'general' || !intent) {
                suggestions.push({
                  label: 'Fakturor',
                  action: () => handleQuickAction({ icon: DollarSign, label: 'Fakturor', path: '/invoices', description: '' }),
                  icon: DollarSign
                })
              }
              
              if (intent === 'time' || intent === 'general' || !intent) {
                suggestions.push({
                  label: 'Tidsrapporter',
                  action: () => handleQuickAction({ icon: FileText, label: 'Tidsrapporter', path: '/reports', description: '' }),
                  icon: FileText
                })
              }
              
              // Always show some quick actions
              const displaySuggestions = suggestions.length > 0 
                ? suggestions.slice(0, 3)
                : quickActions.slice(0, 3).map(a => ({ label: a.label, action: () => handleQuickAction(a), icon: a.icon }))
              
              return displaySuggestions.map((suggestion, idx) => {
                const Icon = suggestion.icon
                return (
                  <button
                    key={idx}
                    onClick={suggestion.action}
                    disabled={isTyping}
                    className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden xs:inline">{suggestion.label}</span>
                  </button>
                )
              })
            })()}
          </div>
        </div>
      )}

      {/* Input - Always visible, fixed at bottom */}
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
            className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
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
