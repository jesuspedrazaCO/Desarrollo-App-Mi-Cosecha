// Descarga un archivo guardado en otro servidor (Cloudinary).
// El atributo "download" de un enlace NO funciona con archivos de otro dominio: el navegador solo abre la imagen en otra pestaña.
// Por eso se baja el archivo y se guarda desde aquí. Si eso falla, se pide a Cloudinary que lo entregue como descarga.

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }

const withExtension = (name, mimeType) => {
  const clean = (name || 'comprobante').replace(/[\\/:*?"<>|]+/g, '_')
  if (/\.[A-Za-z0-9]{2,5}$/.test(clean)) return clean
  return `${clean}.${EXTENSIONS[mimeType] || 'jpg'}`
}

// Cloudinary entrega el archivo como descarga si se agrega "fl_attachment" a la dirección.
const attachmentUrl = (url, filename) => {
  if (!url.includes('/upload/')) return null
  const base = filename.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9_-]+/g, '_') || 'comprobante'
  return url.replace('/upload/', `/upload/fl_attachment:${base}/`)
}

export const downloadFile = async (url, filename) => {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const name = withExtension(filename, blob.type)
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = name
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(link.href), 15000)
  } catch (err) {
    const fallback = attachmentUrl(url, withExtension(filename))
    if (!fallback) throw err
    window.location.assign(fallback)
  }
}
