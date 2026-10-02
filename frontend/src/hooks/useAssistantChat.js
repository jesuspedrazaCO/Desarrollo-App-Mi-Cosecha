import { useState, useEffect, useCallback, useRef } from 'react'
import { getAssistantConversation, startNewAssistantConversation, sendAssistantMessage } from '../services/assistant'
import { resizeImageToBase64 } from '../utils/imageResize'
import toast from 'react-hot-toast'

export const useAssistantChat = () => {
  const [conversation, setConversation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    ;(async () => {
      try {
        const res = await getAssistantConversation()
        setConversation(res.data.data)
      } catch (err) {
        toast.error('No se pudo cargar la conversación')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const send = useCallback(
    async (message, imageFile = null) => {
      if (!conversation) return
      setSending(true)

      const optimisticText = imageFile ? `📷 ${message || '[Foto enviada]'}` : message
      setConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, { role: 'user', content: optimisticText }],
      }))

      try {
        let imageBase64 = null
        let imageMimeType = null
        if (imageFile) {
          const resized = await resizeImageToBase64(imageFile)
          imageBase64 = resized.base64
          imageMimeType = resized.mimeType
        }

        const res = await sendAssistantMessage(conversation._id, message, imageBase64, imageMimeType)
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
      const res = await startNewAssistantConversation()
      setConversation(res.data.data)
    } catch (err) {
      toast.error('No se pudo iniciar una nueva conversación')
    } finally {
      setLoading(false)
    }
  }, [])

  return { conversation, loading, sending, send, newChat }
}