// Redimensiona y comprime una imagen en el navegador (usando canvas) antes de
// mandarla al backend — así una foto de celular de 4-5MB baja a unos cientos de KB.
export const resizeImageToBase64 = (file, maxDim = 1024, quality = 0.75) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        const base64 = dataUrl.split(',')[1]
        resolve({ base64, mimeType: 'image/jpeg' })
      }
      img.onerror = () => reject(new Error('No se pudo leer la imagen'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })