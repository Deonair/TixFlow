import Organizer from '../models/organizerModel.js'
import bcrypt from 'bcryptjs'

export const registerOrganizer = async (req, res) => {
  try {
    const { name, email, organization, password } = req.body || {}
    const errs = {}
    const nameStr = String(name || '').trim()
    const emailStr = String(email || '').toLowerCase().trim()
    const orgStr = String(organization || '').trim()
    const passStr = String(password || '')
    if (!nameStr) errs.name = 'name is required'
    if (!/^\S+@\S+\.\S+$/.test(emailStr)) errs.email = 'invalid email'
    if (!orgStr) errs.organization = 'organization is required'
    if (!passStr || passStr.length < 8) errs.password = 'password too short'
    if (Object.keys(errs).length) return res.status(400).json({ message: 'Validation error', errors: errs })
    const exists = await Organizer.findOne({ email: emailStr })
    if (exists) return res.status(409).json({ message: 'Email already registered' })
    const hash = await bcrypt.hash(passStr, 10)
    const doc = await Organizer.create({ name: nameStr, email: emailStr, organization: orgStr, passwordHash: hash })
    return res.status(201).json({ id: doc._id, name: doc.name, email: doc.email, organization: doc.organization })
  } catch (error) {
    return res.status(500).json({ message: 'Error registering', error: error.message })
  }
}