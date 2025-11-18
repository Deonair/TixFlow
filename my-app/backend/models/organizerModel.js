import mongoose from 'mongoose'

const organizerSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  organization: { type: String, required: true, maxlength: 150 },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Organizer', organizerSchema)