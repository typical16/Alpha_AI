import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const LOCAL_STORAGE_KEY = 'openrouter_chat_history_v1'
const LOCAL_STORAGE_SETTINGS = 'openrouter_chat_settings_v1'

function loadHistory() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history))
  } catch {}
}

export default function App() {
  const [messages, setMessages] = useState(() => loadHistory())
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SETTINGS)
      if (!raw) return { temperature: 0.7 }
      const parsed = JSON.parse(raw)
      return {
        temperature: typeof parsed.temperature === 'number' ? parsed.temperature : 0.7,
      }
    } catch {
      return { temperature: 0.7 }
    }
  })

  const containerRef = useRef(null)

  useEffect(() => {
    saveHistory(messages)
  }, [messages])

  useEffect(() => {
    try { localStorage.setItem(LOCAL_STORAGE_SETTINGS, JSON.stringify(settings)) } catch {}
  }, [settings])

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading])

  async function sendMessage() {
    if (!canSend) return
    setError('')
    const userMsg = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await axios.post('/api/chat', {
        messages: [...messages, userMsg],
        temperature: settings.temperature,
      })
      const aiMsg = { role: 'assistant', content: res.data?.content || 'No response' }
      setMessages(prev => [...prev, aiMsg])
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Request failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function clearHistory() {
    setMessages([])
    setError('')
  }

  return (
    <div className="min-h-full text-stone-900">
      <div className="mx-auto max-w-6xl h-screen flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className={
          'backdrop-blur w-full md:w-80 md:flex-shrink-0 md:block border-r ' +
          'bg-sand-100/80 border-sand-500/30 ' +
          (showSettings ? 'block' : 'hidden md:block')
        }>
          <div className="h-14 flex items-center justify-between px-4 border-b border-sand-500/30">
            <div className="font-semibold">Settings</div>
            <button className="md:hidden text-stone-500" onClick={()=> setShowSettings(false)}>Close</button>
          </div>
          <div className="p-4 space-y-5">
            <div>
              <label className="text-xs font-medium text-stone-600">Temperature: {settings.temperature.toFixed(2)}</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={settings.temperature}
                onChange={(e)=> setSettings(s => ({ ...s, temperature: parseFloat(e.target.value) }))}
                className="w-full accent-amber-600"
              />
            </div>
            <button
              className="w-full rounded-xl border px-3 py-2 text-sm bg-sand-100/80 hover:bg-sand-100 border-sand-500/30 shadow-soft"
              onClick={clearHistory}
            >Clear conversation</button>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex-1 h-screen flex flex-col">
          <header className="px-4 h-16 border-b backdrop-blur flex items-center justify-between sticky top-0 z-10 bg-sand-100/80 border-sand-500/30">
            <div className="flex items-center gap-3">
              <button className="md:hidden rounded-xl border px-3 py-1.5 text-sm bg-sand-100/80 border-sand-500/30 shadow-sm" onClick={()=> setShowSettings(s=>!s)}>Settings</button>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight flex items-center gap-2">
                Alpha
                <span className="inline-block w-2 h-2 rounded-full bg-amber-600"/>
              </h1>
            </div>
            <div className="text-xs text-stone-500 hidden md:block">Local storage only</div>
          </header>

          <main className="flex-1 overflow-hidden">
            <div ref={containerRef} className="h-full overflow-y-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-5 nice-scrollbar">
              {messages.length === 0 && (
                <div className="text-center text-stone-500 mt-12">Start by asking a question…</div>
              )}
              {messages.map((m, idx) => (
                <MessageBubble key={idx} role={m.role} content={m.content} />
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-sand-50 border border-sand-500/30 text-stone-900 max-w-[85%] rounded-2xl px-4 py-3 shadow-soft">
                    <span className="inline-flex gap-1 items-center">
                      <span className="w-2 h-2 bg-sand-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-sand-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-sand-500 rounded-full animate-bounce"></span>
                    </span>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-center">
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-md px-3 py-2 text-sm">
                    {error}
                  </div>
                </div>
              )}
            </div>
          </main>

          <footer className="border-t bg-sand-100/80 backdrop-blur p-3 sticky bottom-0 safe-area-bottom border-sand-500/30">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e)=> setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Send a message…"
                rows={1}
                className="flex-1 resize-none max-h-40 min-h-[44px] rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 bg-sand-100/80 md:min-h-[48px] placeholder:text-stone-400 border-sand-500/30 focus:ring-sage-500/40"
              />
              <button
                onClick={sendMessage}
                disabled={!canSend}
                className="h-[44px] md:h-[48px] px-4 rounded-xl bg-sage-600 hover:bg-sage-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-soft"
              >Send</button>
            </div>
              <div className="text-[11px] text-stone-500 mt-2">Enter to send. Shift+Enter for new line.</div>
          </footer>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ role, content }) {
  const isUser = role === 'user'
  async function copyText() {
    try {
      await navigator.clipboard.writeText(content)
    } catch {}
  }
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div className={'flex max-w-[90%] md:max-w-[75%] gap-3 items-start'}>
        {!isUser && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-600 text-white shrink-0">AI</div>
        )}
        <div className={
          'rounded-2xl px-4 py-3 shadow-soft relative group ' +
          (isUser ? 'bg-sage-600 text-white' : 'bg-sand-50 border border-sand-500/30 text-stone-900')
        }>
          {isUser ? (
            <div className="whitespace-pre-wrap break-words text-sm md:text-base">{content}</div>
          ) : (
            <div className="prose prose-stone max-w-none prose-a:text-sage-600 prose-strong:text-stone-900 prose-code:bg-sand-100 prose-code:px-1 prose-code:py-0.5 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-pre:my-3 prose-code:before:content-[''] prose-code:after:content-[''] text-sm md:text-base">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
          {!isUser && (
            <button onClick={copyText} className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 -right-2 text-xs bg-stone-800 text-white rounded px-2 py-1">Copy</button>
          )}
        </div>
        {isUser && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-800 text-white shrink-0">U</div>
        )}
      </div>
    </div>
  )
}


