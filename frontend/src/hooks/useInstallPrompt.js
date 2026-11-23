import { useState, useEffect } from 'react'

// Detecta si la app ya está instalada, si el navegador permite instalarla con un botón (Android/Chrome)
// o si hay que explicar los pasos a mano (iPhone/Safari).
export const useInstallPrompt = () => {
  const [promptEvent, setPromptEvent] = useState(null)
  const [installed, setInstalled] = useState(() => {
    try {
      return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    } catch { return false }
  })

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setPromptEvent(e) }
    const onInstalled = () => { setInstalled(true); setPromptEvent(null) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  const install = async () => {
    if (!promptEvent) return false
    promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    setPromptEvent(null)
    return outcome === 'accepted'
  }

  return { installed, canInstall: !!promptEvent, isIOS, install }
}