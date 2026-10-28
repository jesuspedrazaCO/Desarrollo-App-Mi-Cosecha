import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { compressImage, formatFileSize } from '../../utils/imageCompress'

// Solo fotos. Se comprimen automáticamente antes de subirlas.
export default function FileUpload({ onFileSelect, accept = 'image/*,.heic,.heif', label = 'Subir foto' }) {
  const inputRef = useRef(null)
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState(null)
  const [info, setInfo] = useState('')
  const [working, setWorking] = useState(false)

  const handleChange = async (e) => {
    const original = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (!original) return

    setWorking(true)
    try {
      const file = await compressImage(original)
      setFileName(original.name)
      setInfo(`${formatFileSize(original.size)} → ${formatFileSize(file.size)}`)
      onFileSelect(file)

      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    } catch (err) {
      toast.error(err.message || 'No se pudo preparar la foto')
      setFileName('')
      setPreview(null)
      setInfo('')
      onFileSelect(null)
    } finally {
      setWorking(false)
    }
  }

  return (
    <div>
      <label className="block text-[13px] font-semibold text-stone-700 mb-1.5">{label}</label>
      <div
        onClick={() => !working && inputRef.current?.click()}
        className="border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center cursor-pointer
          hover:border-primary-300 hover:bg-primary-50/40 transition-all duration-200 ease-smooth bg-white/60"
      >
        {preview ? (
          <img src={preview} alt="Vista previa" className="max-h-32 mx-auto rounded-xl mb-2 object-contain" />
        ) : (
          <div className="text-3xl mb-2">📷</div>
        )}
        <p className="text-sm font-medium text-stone-700">
          {working ? 'Preparando la foto...' : fileName || 'Toca para tomar o elegir una foto'}
        </p>
        <p className="text-xs text-stone-400 mt-1">
          {info ? `Foto comprimida: ${info}` : 'Solo fotos, de cualquier celular o computador. Se comprimen solas.'}
        </p>
      </div>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
    </div>
  )
}
