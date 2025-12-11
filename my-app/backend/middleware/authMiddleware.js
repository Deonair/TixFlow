export const requireAuth = (req, res, next) => {
  const user = req.session?.user
  if (!user) return res.status(401).json({ message: 'Not authenticated' })
  next()
}

// Superadmin: toegestaan via aparte superadmin-sessie of whitelist (email/ID)
export const requireSuperAdmin = (req, res, next) => {
  const sa = req.session?.superadmin
  if (sa && sa.email) return next()

  const user = req.session?.user
  const emailsEnv = String(process.env.SUPERADMIN_EMAILS || '')
  const idsEnv = String(process.env.SUPERADMIN_IDS || '')
  const allowedEmails = emailsEnv.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  const allowedIds = idsEnv.split(',').map(s => s.trim()).filter(Boolean)
  const userEmail = String(user?.email || '').toLowerCase()
  const userId = String(user?.id || '')
  const isEmailOk = userEmail && allowedEmails.includes(userEmail)
  const isIdOk = userId && allowedIds.includes(userId)

  if (isEmailOk || isIdOk) return next()
  return res.status(403).json({ message: 'Superadmin required' })
}
