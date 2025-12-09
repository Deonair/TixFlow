import mongoose from 'mongoose'

const organizerSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  organization: { type: String, required: true, maxlength: 150 },
  passwordHash: { type: String, required: true },
  iban: { type: String, trim: true },
  kvk: { type: String, trim: true },
  btw: { type: String, trim: true },
  billingContact: { type: String, trim: true, maxlength: 100 },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Organizer', organizerSchema)
