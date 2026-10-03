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
    // Zonas que NO se siembran dentro del lote (carretera, casa, quebrada, etc.).
    // Cada zona es su propio polígono. Campo nuevo y opcional — los lotes
    // guardados antes de este cambio simplemente quedan con un arreglo vacío.
    exclusionZones: {
      type: [
        {
          points: [
            {
              lat: { type: Number, required: true },
              lng: { type: Number, required: true },
              _id: false,
            },
          ],
          _id: false,
        },
      ],
      default: [],
    },
    areaM2: { type: Number, required: true, min: 0 },
    areaHectares: { type: Number, required: true, min: 0 },

    orientation: { type: String, enum: ['horizontal', 'vertical'], default: 'horizontal' },
    patternMode: { type: String, enum: ['simple', 'grouped'], default: 'simple' },
    rowSpacing: { type: Number, default: null },        // modo simple
    rowsPerGroup: { type: Number, default: 1 },          // modo agrupado
    intraGroupSpacing: { type: Number, default: null },  // entre surcos del mismo grupo
    interGroupSpacing: { type: Number, default: null },  // pasillo entre grupos
    plantSpacing: { type: Number, required: true, min: 0 },

    totalRows: { type: Number, default: 0 },
    plantsPerRow: { type: Number, default: 0 },
    estimatedPlants: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
)

plantingPlotSchema.index({ owner: 1, createdAt: -1 })

export default mongoose.model('PlantingPlot', plantingPlotSchema)