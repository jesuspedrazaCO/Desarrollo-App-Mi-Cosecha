// Prepara una foto para subirla, sin importar de qué celular o computador venga:
//  - Acepta cualquier foto que el navegador pueda leer (JPG, PNG, WEBP, GIF, BMP, AVIF...).
//  - Las fotos HEIC/HEIF (iPhone, algunos Samsung) se convierten solas, aunque el navegador no las lea.
//  - La achica y la comprime: una foto de 5-10 MB baja a unos 200-400 KB. Siempre se sube como JPG.
const BAD_PHOTO = 'No se pudo leer la foto. Prueba con otra imagen.'
const NOT_PHOTO = 'Solo se permiten fotos.'

const looksHeic = (file) => /hei[cf]/i.test(file.type || '') || /\.hei[cf]$/i.test(file.name || '')

// Algunos celulares no informan el tipo del archivo: en ese caso se mira la extensión.
export const isPhotoFile = (file) => {
  if (!file) return false
  if (file.type) return file.type.startsWith('image/') && file.type !== 'image/svg+xml'
  return /\.(jpe?g|png|webp|gif|bmp|avif|hei[cf])$/i.test(file.name || '')
}

const loadImage = (blob) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(BAD_PHOTO)) }
    img.src = url
  })

// La librería de HEIC pesa bastante: solo se descarga cuando llega una foto HEIC que el navegador no puede leer.
const heicToJpeg = async (file) => {
  const { default: heic2any } = await import('heic2any')
  const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
  return Array.isArray(out) ? out[0] : out
}

const readPhoto = async (file) => {
  try {
    return await loadImage(file)
  } catch (err) {
    if (!looksHeic(file)) throw err
    try {
      return await loadImage(await heicToJpeg(file))
    } catch {
      throw new Error('No se pudo leer esta foto HEIC. Tómala de nuevo o elige otra.')
    }
  }
}

const makeFile = (blob, name) => {
  try {
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    blob.name = name // navegadores muy viejos sin constructor File
    return blob
  }
}

export const compressImage = async (file, { maxDim = 1600, quality = 0.75 } = {}) => {
  if (!isPhotoFile(file)) throw new Error(NOT_PHOTO)
  const img = await readPhoto(file)

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff' // PNG o WEBP con fondo transparente
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!blob) throw new Error('No se pudo comprimir la foto.')
  const name = (file.name || 'foto').replace(/\.[^.]+$/, '') + '.jpg'
  return makeFile(blob, name)
}

// Para los chats de IA: deja la foto en un formato que el navegador pueda leer (convierte HEIC si hace falta).
export const ensureReadablePhoto = async (file) => {
  if (!isPhotoFile(file)) throw new Error(NOT_PHOTO)
  return compressImage(file, { maxDim: 2000, quality: 0.9 })
}

export const formatFileSize = (bytes = 0) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
