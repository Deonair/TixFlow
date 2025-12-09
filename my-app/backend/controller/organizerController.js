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

export const loginOrganizer = async (req, res) => {
  try {
    const { email, password } = req.body || {}
    const emailStr = String(email || '').toLowerCase().trim()
    const passStr = String(password || '')
    if (!/\S+@\S+\.\S+/.test(emailStr) || !passStr) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }
    const user = await Organizer.findOne({ email: emailStr })
    if (!user) return res.status(401).json({ message: 'Incorrect email or password' })
    const ok = await bcrypt.compare(passStr, user.passwordHash)
    if (!ok) return res.status(401).json({ message: 'Incorrect email or password' })
    // set session
    req.session.user = { id: String(user._id), email: user.email, name: user.name, organization: user.organization }
    return res.json({ id: user._id, email: user.email, name: user.name, organization: user.organization })
  } catch (error) {
    return res.status(500).json({ message: 'Error logging in', error: error.message })
  }
}

export const logoutOrganizer = (req, res) => {
  try {
    req.session.destroy(() => {
      res.clearCookie('connect.sid')
      res.json({ ok: true })
    })
  } catch (error) {
    res.status(500).json({ message: 'Error logging out', error: error.message })
  }
}

export const me = async (req, res) => {
  const sessionUser = req.session?.user
  if (!sessionUser) return res.status(401).json({ message: 'Not authenticated' })
  try {
    const doc = await Organizer.findById(sessionUser.id).lean()
    if (!doc) return res.status(404).json({ message: 'User not found' })
    return res.json({ id: String(doc._id), name: doc.name, email: doc.email, organization: doc.organization, iban: doc.iban || '', kvk: doc.kvk || '', btw: doc.btw || '', billingContact: doc.billingContact || '' })
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching user', error: error.message })
  }
}

export const updateMe = async (req, res) => {
  const sessionUser = req.session?.user
  if (!sessionUser) return res.status(401).json({ message: 'Not authenticated' })
  try {
    const { name, email, password, confirm, organization, iban, kvk, btw, billingContact } = req.body || {}
    const updates = {}
    const errs = {}
    const current = await Organizer.findById(sessionUser.id).lean()
    if (!current) return res.status(404).json({ message: 'User not found' })
    const nameStr = typeof name === 'string' ? name.trim() : undefined
    const emailStr = typeof email === 'string' ? email.toLowerCase().trim() : undefined
    const passStr = typeof password === 'string' ? password : undefined
    const confStr = typeof confirm === 'string' ? confirm : undefined
    const orgStr = typeof organization === 'string' ? organization.trim() : undefined
    let ibanStr = typeof iban === 'string' ? iban.replace(/\s+/g, '').toUpperCase().trim() : undefined
    const kvkStr = typeof kvk === 'string' ? kvk.trim() : undefined
    const btwStr = typeof btw === 'string' ? btw.trim().toUpperCase() : undefined
    const contactStr = typeof billingContact === 'string' ? billingContact.trim() : undefined
    if (nameStr !== undefined) {
      if (!nameStr) errs.name = 'name is required'
      else updates.name = nameStr
    }
    if (emailStr !== undefined) {
      if (!/^\S+@\S+\.\S+$/.test(emailStr)) errs.email = 'invalid email'
      else updates.email = emailStr
    }
    if (orgStr !== undefined) {
      if (!orgStr) errs.organization = 'organization is required'
      else if (orgStr.length > 150) errs.organization = 'organization too long'
      else updates.organization = orgStr
    }
    if (passStr !== undefined || confStr !== undefined) {
      if (!passStr || passStr.length < 8) errs.password = 'password too short'
      if (confStr !== passStr) errs.confirm = 'passwords do not match'
    }
    if (ibanStr !== undefined) {
      if (!ibanStr) errs.iban = 'iban is required'
      else if (!/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(ibanStr)) errs.iban = 'invalid iban'
      else updates.iban = ibanStr
    }
    if (kvkStr !== undefined) {
      if (current.kvk && current.kvk !== kvkStr) errs.kvk = 'kvk locked'
      else if (!/^\d{8}$/.test(kvkStr)) errs.kvk = 'invalid kvk'
      else updates.kvk = kvkStr
    }
    if (btwStr !== undefined) {
      if (current.btw && current.btw !== btwStr) errs.btw = 'btw locked'
      else if (!/^NL\d{9}B\d{2}$/.test(btwStr)) errs.btw = 'invalid btw'
      else updates.btw = btwStr
    }
    if (contactStr !== undefined) {
      if (!contactStr) errs.billingContact = 'billingContact is required'
      else if (contactStr.length > 100) errs.billingContact = 'billingContact too long'
      else updates.billingContact = contactStr
    }
    if (Object.keys(errs).length) {
      return res.status(400).json({ message: 'Validation error', errors: errs })
    }
    if (updates.email) {
      const exists = await Organizer.findOne({ email: updates.email, _id: { $ne: sessionUser.id } })
      if (exists) return res.status(409).json({ message: 'Email already in use' })
    }
    if (passStr) {
      const hash = await bcrypt.hash(passStr, 10)
      updates.passwordHash = hash
    }
    const updated = await Organizer.findByIdAndUpdate(sessionUser.id, updates, { new: true })
    if (!updated) return res.status(404).json({ message: 'User not found' })
    req.session.user = { id: String(updated._id), email: updated.email, name: updated.name, organization: updated.organization }
    return res.json({ id: String(updated._id), name: updated.name, email: updated.email, organization: updated.organization, iban: updated.iban || '', kvk: updated.kvk || '', btw: updated.btw || '', billingContact: updated.billingContact || '' })
  } catch (error) {
    return res.status(500).json({ message: 'Error updating user', error: error.message })
  }
}
