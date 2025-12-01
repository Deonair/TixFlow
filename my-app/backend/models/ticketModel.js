import mongoose from 'mongoose'

const ticketSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  attendeeEmail: { type: String, required: true, lowercase: true, trim: true },
  ticketTypeName: { type: String, required: true },
  token: { type: String, required: true, unique: true, index: true },
  redeemed: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.model('Ticket', ticketSchema)

