const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const db = getDb();
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;

  const logs = db
    .prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(limit, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM audit_log').get().count;

  res.json({ logs, total, limit, offset });
});

function logAudit(userId, userEmail, action, details, ipAddress) {
  try {
    const db = getDb();
    db.prepare(
      'INSERT INTO audit_log (user_id, user_email, action, details, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, userEmail, action, details || null, ipAddress || null);
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

module.exports = router;
module.exports.logAudit = logAudit;
