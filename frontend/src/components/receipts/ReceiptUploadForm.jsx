import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toInputDate } from '../../utils/formatDate'
import FileUpload from '../common/FileUpload'
import Input from '../common/Input'
import Button from '../common/Button'

const RECEIPT_CATEGORIES = [
  'Semillas', 'Fertilizantes', 'Maquinaria', 'Combustible',
  'Transporte', 'Mano de obra', 'Servicios del hogar', 'Otro',
]

export default function ReceiptUploadForm({ crops = [], onSubmit, onCancel, loading }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { date: toInputDate(new Date()) },
  })

  const handleFormSubmit = async (data) => {
    if (!selectedFile) {
      alert('Debes seleccionar un archivo')
      return
    }
    const formData = new FormData()
    formData.append('file', selectedFile)
    if (data.crop) formData.append('crop', data.crop)
    if (data.category) formData.append('category', data.category)
    if (data.description) formData.append('description', data.description)
    if (data.date) formData.append('date', data.date)
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <FileUpload
        label="Archivo del comprobante"
        onFileSelect={setSelectedFile}
        accept="image/*,.pdf"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Fecha" type="date"
          error={errors.date?.message}
          {...register('date')}
        />

        <div>
          <label className="block text-[13px] font-semibold text-stone-700 mb-1.5">Categoría</label>
          <select
            className="w-full border border-stone-200 rounded-2xl px-4 py-2.5 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-400/40"
            {...register('category')}
          >
            <option value="">Sin categoría</option>
            {RECEIPT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-stone-700 mb-1.5">Cultivo relacionado</label>
          <select
            className="w-full border border-stone-200 rounded-2xl px-4 py-2.5 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-400/40"
            {...register('crop')}
          >
            <option value="">Sin cultivo</option>
            {crops.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        <Input
          label="Descripción"
          placeholder="Ej: Factura de semillas"
          {...register('description')}
        />
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-stone-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>Subir comprobante</Button>
      </div>
    </form>
  )
}
