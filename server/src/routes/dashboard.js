const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/stats', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  const totalSearches = isAdmin
    ? db.prepare('SELECT COUNT(*) as count FROM search_history').get().count
    : db.prepare('SELECT COUNT(*) as count FROM search_history WHERE user_id = ?').get(userId).count;

  const totalUsers = isAdmin
    ? db.prepare('SELECT COUNT(*) as count FROM users').get().count
    : null;

  const recentSearches = isAdmin
    ? db.prepare(`
        SELECT sh.*, u.email as user_email
        FROM search_history sh
        LEFT JOIN users u ON sh.user_id = u.id
        ORDER BY sh.created_at DESC LIMIT 5
      `).all()
    : db.prepare('SELECT * FROM search_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 5').all(userId);

  const topStates = isAdmin
    ? db.prepare('SELECT state, COUNT(*) as count FROM search_history GROUP BY state ORDER BY count DESC LIMIT 5').all()
    : db.prepare('SELECT state, COUNT(*) as count FROM search_history WHERE user_id = ? GROUP BY state ORDER BY count DESC LIMIT 5').all(userId);

  const perilCounts = {};
  const historyRows = isAdmin
    ? db.prepare('SELECT results FROM search_history WHERE results IS NOT NULL').all()
    : db.prepare('SELECT results FROM search_history WHERE user_id = ? AND results IS NOT NULL').all(userId);

  for (const row of historyRows) {
    try {
      const parsed = JSON.parse(row.results);
      const perils = parsed.perilEvents || [];
      for (const p of perils) {
        for (const type of (p.types || [])) {
          perilCounts[type] = (perilCounts[type] || 0) + 1;
        }
      }
    } catch {
      // skip malformed results
    }
  }

  const topPerils = Object.entries(perilCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  res.json({
    totalSearches,
    totalUsers,
    recentSearches: recentSearches.map((s) => ({
      id: s.id,
      city: s.city,
      state: s.state,
      date_of_loss: s.date_of_loss,
      created_at: s.created_at,
      user_email: s.user_email || undefined,
    })),
    topStates,
    topPerils,
  });
});

module.exports = router;
