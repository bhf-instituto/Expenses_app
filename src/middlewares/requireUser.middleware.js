export const requireUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      message: 'No user logged in'
    });
  }

  // si hay usuario continuamos 
  next();
};