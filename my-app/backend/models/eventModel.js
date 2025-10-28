import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    maxlength: 25
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
  }
});

export default mongoose.model('Event', eventSchema);
