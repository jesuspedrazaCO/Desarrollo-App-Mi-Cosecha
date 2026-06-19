import { useState, useEffect } from 'react'
import { useReceipts } from '../hooks/useReceipts'
import { getCrops } from '../services/cropService'
import ReceiptUploadForm from '../components/receipts/ReceiptUploadForm'
import ReceiptGallery from '../components/receipts/ReceiptGallery'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Button from '../components/common/Button'
import Pagination from '../components/common/Pagination'
import toast from 'react-hot-toast'

export default function ReceiptsPage() {
  const { receipts, total, totalPages, loading, params, setParams, upload, remove } = useReceipts()
  const [crops, setCrops] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    getCrops().then(r => setCrops(r.data)).catch(() => {})
  }, [])

  const handleUpload = async (formData) => {
    setFormLoading(true)
    try {
      await upload(formData)
      setShowForm(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al subir el archivo')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    setFormLoading(true)
    try {
      await remove(deleting._id)
      setDeleting(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-float-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Comprobantes 🧾</h1>
          <p className="text-stone-500 text-sm mt-1">{total} archivo{total !== 1 ? 's' : ''} guardados</p>
        </div>
        <div className="flex gap-2">
          <select
            onChange={(e) => setParams(p => ({ ...p, crop: e.target.value || undefined, page: 1 }))}
            className="border border-stone-200 rounded-full px-4 py-2 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-400/40"
          >
            <option value="">Todos los cultivos</option>
            {crops.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <Button onClick={() => setShowForm(true)}>+ Subir comprobante</Button>
        </div>
      </div>

      <ReceiptGallery
        receipts={receipts}
        loading={loading}
        onDelete={(r) => setDeleting(r)}
      />

      <Pagination
        page={params.page || 1}
        totalPages={totalPages}
        onPageChange={(p) => setParams(prev => ({ ...prev, page: p }))}
      />

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Subir comprobante"
        size="lg"
      >
        <ReceiptUploadForm
          crops={crops}
          onSubmit={handleUpload}
          onCancel={() => setShowForm(false)}
          loading={formLoading}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar comprobante"
        message="¿Seguro que deseas eliminar este comprobante? También se borrará el archivo."
        loading={formLoading}
      />
    </div>
  )
}
