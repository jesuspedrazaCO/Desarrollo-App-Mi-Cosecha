import { useState, useRef, useEffect } from 'react'
import { Send, RotateCcw, Camera, X } from 'lucide-react'
import { useAssistantChat } from '../hooks/useAssistantChat'
export default function AssistantChat() {
  const { conversation, loading, sending, send, newChat } = useAssistantChat()
  const [input, setInput] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages?.length])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedImage(file)
    setPreviewUrl(URL.createObjectURL(file))
    e.target.value = ''
  }

  const clearImage = () => {
    setSelectedImage(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  const handleSend = () => {
    if ((!input.trim() && !selectedImage) || sending) return
    send(input.trim(), selectedImage)
    setInput('')
    clearImage()
  }

  return (
    <div
      className="rounded-2xl p-3 sm:p-5 border flex flex-col w-full"
      style={{
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(24px)',
        borderColor: 'rgba(255,255,255,0.15)',
        height: 'min(600px, 75vh)',
      }}
    >
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img
            src="/scooby.jpeg"
            alt="Scooby"
            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
          />
          <h3 className="font-fraunces text-base sm:text-lg text-white">Scooby</h3>
        </div>
        <button
          onClick={newChat}
          className="flex items-center gap-1 text-xs text-white/60 hover:text-white flex-shrink-0"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Nueva conversación</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
        {loading && <p className="text-white/50 text-sm">Cargando conversación...</p>}

        {!loading && conversation?.messages?.length === 0 && (
          <div className="flex items-start gap-2">
            <img src="/scooby.jpeg" alt="Scooby" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
            <p className="text-white/50 text-sm">
              ¡Hola! Soy Scooby 🐾 Pregúntame lo que necesites: desde cómo van tus cultivos
              financieramente, hasta qué le pasa a una planta — <strong>toma una foto</strong> si
              quieres que te ayude a diagnosticarla. Estoy para ayudarte con todo lo de tu finca.
            </p>
          </div>
        )}

        {conversation?.messages?.map((m, i) => (
          <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <img src="/scooby.jpeg" alt="Scooby" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
            )}
            <div
              className="max-w-[85%] sm:max-w-[80%] rounded-xl px-3 py-2 text-sm break-words whitespace-pre-wrap"
              style={{
                background: m.role === 'user' ? '#1a6e3c' : 'rgba(255,255,255,0.1)',
                color: 'white',
              }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex items-end gap-2 justify-start">
            <img src="/scooby.jpeg" alt="Scooby" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
            <div
              className="rounded-xl px-3 py-2 text-sm text-white/60"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              {selectedImage ? 'Analizando la foto...' : 'Escribiendo...'}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {previewUrl && (
        <div className="flex items-center gap-2 mt-3 flex-shrink-0 rounded-xl p-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <img src={previewUrl} alt="Foto a analizar" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
          <span className="text-xs text-white/60 flex-1 truncate">Foto lista para enviar</span>
          <button onClick={clearImage} className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 flex-shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || loading}
          className="p-2.5 rounded-lg text-white/70 hover:text-white disabled:opacity-40 flex-shrink-0 transition-colors"
          style={{ background: 'rgba(255,255,255,0.10)' }}
          title="Adjuntar o tomar una foto"
        >
          <Camera size={17} />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={selectedImage ? 'Describe brevemente (opcional)...' : 'Pregúntale algo a Scooby...'}
          disabled={sending || loading}
          style={{
            background: 'rgba(255,255,255,0.85)',
            color: '#1c1917',
          }}
          className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button
          onClick={handleSend}
          disabled={sending || loading || (!input.trim() && !selectedImage)}
          className="p-2 rounded-lg bg-emerald-600 text-white disabled:opacity-40 flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}