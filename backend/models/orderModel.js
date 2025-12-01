import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unitAmount: { type: Number, required: true }, // in cents
  quantity: { type: Number, required: true },
}, { _id: false })

const orderSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  items: { type: [orderItemSchema], default: [] },
  amountTotal: { type: Number, required: true }, // in cents
  currency: { type: String, required: true, default: 'eur' },
  customerEmail: { type: String, required: true, lowercase: true, trim: true },
  stripeSessionId: { type: String, required: true, index: true, unique: true },
  paymentIntentId: { type: String },
  status: { type: String, enum: ['paid', 'created', 'canceled', 'refunded'], default: 'paid', index: true },
}, { timestamps: true })

export default mongoose.model('Order', orderSchema)

