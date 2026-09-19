import Contributor from '../models/Contributor.js'
import Expense from '../models/Expense.js'

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
    const expenses = await Expense.find({ owner: req.user.id, 'payers.0': { $exists: true } })
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