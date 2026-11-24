import mongoose from 'mongoose'
import Contributor from '../models/Contributor.js'
import Expense from '../models/Expense.js'
import Crop from '../models/Crop.js'

// scope=active → solo gastos de cultivos activos (igual que el dashboard); cualquier otro valor → todos
const withScope = async (ownerId, scope, filter) => {
  if (scope !== 'active') return filter
  const activeCrops = await Crop.find({ owner: ownerId, status: 'activo' }).select('_id')
  return { ...filter, crop: { $in: activeCrops.map((crop) => crop._id) } }
}

export const getContributors = async (req, res, next) => {
  try {
    const contributors = await Contributor.find({ owner: req.user.id }).sort({ name: 1 })
    res.json({ success: true, data: contributors })
  } catch (err) {
    next(err)
  }
}

export const createContributor = async (req, res, next) => {
  try {
    const { name } = req.body
    const contributor = await Contributor.create({ owner: req.user.id, name })
    res.status(201).json({ success: true, data: contributor })
  } catch (err) {
    next(err)
  }
}

export const deleteContributor = async (req, res, next) => {
  try {
    const contributor = await Contributor.findOneAndDelete({ _id: req.params.id, owner: req.user.id })
    if (!contributor) {
      return res.status(404).json({ success: false, message: 'Aportante no encontrado' })
    }
    res.json({ success: true, message: 'Aportante eliminado' })
  } catch (err) {
    next(err)
  }
}

// Cuánto ha puesto cada persona en total, en toda la finca (todos los cultivos)
export const getFarmWideSummary = async (req, res, next) => {
  try {
    const scope = req.query.scope === 'active' ? 'active' : 'all'
    const expenses = await Expense.find(await withScope(req.user.id, scope, { owner: req.user.id, 'payers.0': { $exists: true } }))
    const totals = {}

    expenses.forEach((e) => {
      (e.payers || []).forEach((p) => {
        const key = String(p.contributor)
        totals[key] = (totals[key] || 0) + p.amount
      })
    })

    const contributors = await Contributor.find({ owner: req.user.id })
    const summary = contributors.map((c) => ({
      contributorId: c._id,
      name: c.name,
      totalPaid: totals[String(c._id)] || 0,
    }))

    res.json({ success: true, data: summary })
  } catch (err) {
    next(err)
  }
}

// Cuánto ha puesto cada persona en un cultivo específico
export const getCropSummary = async (req, res, next) => {
  try {
    const { cropId } = req.params
    const expenses = await Expense.find({ owner: req.user.id, crop: cropId, 'payers.0': { $exists: true } })
    const totals = {}

    expenses.forEach((e) => {
      (e.payers || []).forEach((p) => {
        const key = String(p.contributor)
        totals[key] = (totals[key] || 0) + p.amount
      })
    })

    const contributorIds = Object.keys(totals)
    const contributors = await Contributor.find({ _id: { $in: contributorIds } })

    const summary = contributors.map((c) => ({
      contributorId: c._id,
      name: c.name,
      totalPaid: totals[String(c._id)] || 0,
    }))

    res.json({ success: true, data: summary })
  } catch (err) {
    next(err)
  }
}

// En qué cultivos ha puesto plata una persona, con fecha y monto de cada aporte
export const getContributorDetail = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Aportante no encontrado' })
    }

    const contributor = await Contributor.findOne({ _id: id, owner: req.user.id })
    if (!contributor) {
      return res.status(404).json({ success: false, message: 'Aportante no encontrado' })
    }

    const scope = req.query.scope === 'active' ? 'active' : 'all'
    const expenses = await Expense.find(await withScope(req.user.id, scope, { owner: req.user.id, 'payers.contributor': id }))
      .populate('crop', 'name')
      .sort({ date: -1 })

    const byCrop = {}
    let totalPaid = 0

    expenses.forEach((e) => {
      const paid = (e.payers || [])
        .filter((p) => String(p.contributor) === String(id))
        .reduce((sum, p) => sum + p.amount, 0)
      if (paid <= 0) return

      const key = e.crop ? String(e.crop._id) : 'general'
      if (!byCrop[key]) {
        byCrop[key] = {
          cropId: e.crop ? e.crop._id : null,
          cropName: e.crop ? e.crop.name : 'Gastos generales (sin cultivo)',
          total: 0,
          items: [],
        }
      }
      byCrop[key].total += paid
      byCrop[key].items.push({
        expenseId: e._id,
        date: e.date,
        description: e.description,
        amount: paid,
      })
      totalPaid += paid
    })

    const crops = Object.values(byCrop).sort((a, b) => b.total - a.total)

    res.json({
      success: true,
      data: { contributorId: contributor._id, name: contributor.name, totalPaid, crops },
    })
  } catch (err) {
    next(err)
  }
}