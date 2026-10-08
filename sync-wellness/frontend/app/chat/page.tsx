'use client'
import React, { useState, useEffect, useRef } from 'react'
import AppShell from '@/components/AppShell'
import { chatService } from '@/services/api'
import { ChatMessage } from '@/types'
import {
  MessageCircle,
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  AlertCircle,
  BookOpen,
  HelpCircle,
  Activity,
  Heart,
} from 'lucide-react'

const SUGGESTED_PROMPTS = [
  'What foods are recommended during my current cycle phase?',
  'How can I naturally manage stress and fatigue today?',
  'What causes cycle length variations and how can I support balance?',
  'Why do sleep needs change across the menstrual cycle?',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingHistory, setFetchingHistory] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadHistory = async () => {
    try {
      const hist = await chatService.getHistory()
      // Backend returns latest first, reverse for chat feed
      setMessages([...hist].reverse())
    } catch (err) {
      console.error('Failed to load chat history:', err)
    } finally {
      setFetchingHistory(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim()
    if (!query || loading) return

    setInput('')
    setLoading(true)

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      message: query,
      question: query,
      response: '',
      answer: '',
      timestamp: new Date().toISOString(),
    }

    try {
      const res = await chatService.sendMessage(query)
      setMessages((prev) => [...prev, res])
    } catch (err) {
      console.error('Failed to send message:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          question: query,
          message: query,
          response:
            "I'm currently unable to connect to the AI wellness service. Please check your backend connection or try again shortly.",
          answer:
            "I'm currently unable to connect to the AI wellness service. Please check your backend connection or try again shortly.",
          sources: [],
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleClearHistory = async () => {
    if (!confirm('Clear your entire chat history?')) return
    try {
      await chatService.clearHistory()
      setMessages([])
    } catch (err) {
      console.error('Failed to clear history:', err)
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-140px)] pb-2 max-w-4xl mx-auto w-full">
        {/* Chat Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-rose-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">
                  AI Wellness Companion
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  Gemini Powered
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Personalized support informed by your recent cycle, mood, and sleep logs.
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1.5 p-2 rounded-lg hover:bg-red-50 transition font-medium"
              title="Clear History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear History</span>
            </button>
          )}
        </div>

        {/* Medical disclaimer note */}
        <div className="my-2 bg-amber-50/80 border border-amber-200/80 text-amber-900 text-[11px] px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            SYNC provides educational wellness insights and is NOT a substitute for professional medical care. In an emergency, please contact local medical services immediately.
          </span>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1.5 scrollbar-thin">
          {messages.length === 0 && !fetchingHistory && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 text-pink-600 flex items-center justify-center mb-4 shadow-xs">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                How can I support your wellness today?
              </h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                Ask anything about your menstrual cycle phases, nutrition ideas, hydration tips, sleep routines, or general lifestyle balance.
              </p>

              {/* Quick suggestions */}
              <div className="w-full space-y-2 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Suggested Inquiries:
                </p>
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="w-full text-xs p-3 rounded-xl border border-rose-100 bg-white hover:bg-rose-50/60 hover:border-pink-300 text-gray-700 transition text-left flex items-center justify-between group shadow-xs"
                  >
                    <span>{prompt}</span>
                    <Send className="w-3 h-3 text-gray-300 group-hover:text-pink-500 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, idx) => {
            const userText = m.message || m.question || ''
            const botText = m.response || m.answer || ''
            return (
              <div key={m.id || idx} className="space-y-3.5">
                {/* User Message */}
                {userText && (
                  <div className="flex items-start justify-end gap-2.5">
                    <div className="wellness-gradient-btn text-white rounded-2xl rounded-tr-xs px-4 py-3 text-sm max-w-lg shadow-xs">
                      {userText}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center shrink-0 font-bold text-xs">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}

                {/* Assistant Response */}
                {botText && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-white border border-rose-100/90 rounded-2xl rounded-tl-xs p-4 text-sm max-w-xl shadow-xs space-y-2">
                      <div className="text-gray-800 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                        {botText}
                      </div>

                      {m.sources && m.sources.length > 0 && (
                        <div className="pt-2 border-t border-rose-50 text-[11px] text-gray-400 flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3 text-purple-400" />
                          <span>
                            Sources: {Array.isArray(m.sources) ? m.sources.join(', ') : m.sources}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-white border border-rose-100 rounded-2xl p-4 text-xs text-gray-500 flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-gray-400">SYNC AI is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="pt-2"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask SYNC about cycles, nutrition, sleep, or mood..."
              className="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-rose-200 bg-white text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 shadow-xs transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 p-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white disabled:opacity-30 transition shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
