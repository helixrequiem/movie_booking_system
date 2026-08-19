const User = require("../models/user");

// Must run AFTER requireAuth, since it needs req.userId already set
async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = requireAdmin;