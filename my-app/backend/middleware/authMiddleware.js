export const requireAuth = (req, res, next) => {
  const user = req.session?.user
  if (!user) return res.status(401).json({ message: 'Not authenticated' })
  next()
}