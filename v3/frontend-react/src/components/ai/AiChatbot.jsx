import React, { useState, useRef, useEffect } from 'react'
import { aiService } from '../../services/aiService'
import { Bot, X, Send, Sparkles, User, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: '👋 Hi! I am **Binimoy AI**, your personal skill exchange guide. Need learning roadmaps or tips on how to exchange skills? Ask me anything below!'
    }
  ])

  const messagesEndRef = useRef(null)

  const quickPrompts = [
    'How does Skill Binimoy work?',
    'How do I schedule a 20-min session?',
    'Web Development learning roadmap',
    'How to propose a skill exchange?'
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const handleSend = async (textToSend) => {
    const query = textToSend || input.trim()
    if (!query || loading) return

    const newMessages = [...messages, { role: 'user', text: query }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      // Build history for backend
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'bot')
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }))

      const response = await aiService.sendMessage(query, history)
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: response.reply || "I'm here to help with all your skill-sharing questions!"
        }
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: '⚠️ Could not connect to Binimoy AI. Please try again in a moment.'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Simple Markdown formatter
  const renderFormattedText = (text) => {
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-800 px-1 py-0.5 rounded text-[#00C2FF] font-mono text-xs">$1</code>')
      .replace(/\n/g, '<br />')

    return <span dangerouslySetInnerHTML={{ __html: formatted }} />
  }

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#00C2FF] text-white flex items-center justify-center shadow-2xl shadow-[#6C63FF]/40 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer',
          isOpen && 'rotate-90 scale-90'
        )}
        title="Binimoy AI Assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6 animate-pulse" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-40 w-[92vw] sm:w-96 h-[560px] max-h-[80vh] glass-card-glow bg-[#1E293B]/95 rounded-3xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="h-16 px-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#00C2FF] flex items-center justify-center text-white shadow-md shadow-[#6C63FF]/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  Binimoy AI <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h4>
                <p className="text-[11px] text-slate-400">Powered by Google Gemini</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-sm">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex gap-2.5 max-w-[85%]',
                  m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs shadow-sm',
                    m.role === 'user'
                      ? 'bg-slate-700 text-slate-200'
                      : 'bg-gradient-to-tr from-[#6C63FF] to-[#00C2FF] text-white'
                  )}
                >
                  {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                <div
                  className={cn(
                    'p-3 rounded-2xl leading-relaxed text-xs sm:text-sm',
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-[#6C63FF] to-[#00C2FF] text-white rounded-tr-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none'
                  )}
                >
                  {renderFormattedText(m.text)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic py-1">
                <Loader2 className="w-4 h-4 animate-spin text-[#00C2FF]" />
                <span>Binimoy AI is thinking...</span>
              </div>
            )}

            {/* Quick Prompts (visible if only initial message) */}
            {messages.length === 1 && (
              <div className="pt-2 space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Suggested Questions:
                </p>
                <div className="flex flex-col gap-1.5">
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(prompt)}
                      className="text-left text-xs px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-[#6C63FF]/20 hover:text-[#00C2FF] border border-slate-700/60 transition-all text-slate-300 cursor-pointer"
                    >
                      💡 {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about skills or roadmaps..."
              className="flex-1 bg-slate-800/90 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#6C63FF]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5a52e0] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
