import { useState, useEffect, useCallback, useRef } from 'react'
import { getAgroConversation, startNewAgroConversation, sendAgroMessage } from '../services/agro'
import toast from 'react-hot-toast'

export const useAgroChat = () => {
  const [conversation, setConversation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    ;(async () => {
      try {
        const res = await getAgroConversation()
        setConversation(res.data.data)
      } catch (err) {
        toast.error('No se pudo cargar la conversación')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const send = useCallback(
    async (message) => {
      if (!conversation) return
      setSending(true)
      setConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, { role: 'user', content: message }],
      }))
      try {
        const res = await sendAgroMessage(conversation._id, message)
        setConversation(res.data.data)
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error al enviar el mensaje')
      } finally {
        setSending(false)
      }
    },
    [conversation]
  )

  const newChat = useCallback(async () => {
    setLoading(true)
    try {
      const res = await startNewAgroConversation()
      setConversation(res.data.data)
    } catch (err) {
      toast.error('No se pudo iniciar una nueva conversación')
    } finally {
      setLoading(false)
    }
  }, [])

  return { conversation, loading, sending, send, newChat }
}