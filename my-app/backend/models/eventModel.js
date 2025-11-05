import mongoose from 'mongoose';

const ticketTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  capacity: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: true });

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 25
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 400
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  ticketTypes: {
    type: [ticketTypeSchema],
    default: []
  }
});

export default mongoose.model('Event', eventSchema);
