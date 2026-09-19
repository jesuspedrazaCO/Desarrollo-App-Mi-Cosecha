import mongoose from 'mongoose'

const contributorSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: 80 },
  },
  { timestamps: true }
)

contributorSchema.index({ owner: 1, name: 1 })

export default mongoose.model('Contributor', contributorSchema)