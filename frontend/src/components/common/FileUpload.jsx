import { useRef, useState } from 'react'

export default function FileUpload({ onFileSelect, accept = 'image/*,.pdf', label = 'Subir archivo' }) {
  const inputRef = useRef(null)
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState(null)

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    onFileSelect(file)

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  return (
    <div>
      <label className="block text-[13px] font-semibold text-stone-700 mb-1.5">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center cursor-pointer
          hover:border-primary-300 hover:bg-primary-50/40 transition-all duration-200 ease-smooth bg-white/60"
      >
        {preview ? (
          <img src={preview} alt="Vista previa" className="max-h-32 mx-auto rounded-xl mb-2 object-contain" />
        ) : (
          <div className="text-3xl mb-2">📎</div>
        )}
        <p className="text-sm font-medium text-stone-700">{fileName || 'Haz clic para seleccionar un archivo'}</p>
        <p className="text-xs text-stone-400 mt-1">JPG, PNG, WEBP o PDF — máx. 5MB</p>
      </div>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
    </div>
  )
}
