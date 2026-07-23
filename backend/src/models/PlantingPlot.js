import mongoose from 'mongoose'

const plantingPlotSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    crop: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop', default: null },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    cropType: { type: String, trim: true, default: '' },
    geometry: [
      {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        _id: false,
      },
    ],
    areaM2: { type: Number, required: true, min: 0 },
    areaHectares: { type: Number, required: true, min: 0 },
    rowSpacing: { type: Number, required: true, min: 0 },
    plantSpacing: { type: Number, required: true, min: 0 },
    estimatedPlants: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
)

plantingPlotSchema.index({ owner: 1, createdAt: -1 })

export default mongoose.model('PlantingPlot', plantingPlotSchema)