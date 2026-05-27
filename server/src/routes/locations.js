const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  const db = getDb();
  const locations = db
    .prepare('SELECT * FROM saved_locations WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json(locations);
});

router.post('/', (req, res) => {
  const { name, street_address, city, state, zipcode, latitude, longitude } = req.body;
  if (!name || !city || !state || !latitude || !longitude) {
    return res.status(400).json({ error: 'Name, city, state, latitude, and longitude are required' });
  }

  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO saved_locations (user_id, name, street_address, city, state, zipcode, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.user.id, name, street_address || '', city, state, zipcode || '', latitude, longitude);

  const loc = db.prepare('SELECT * FROM saved_locations WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(loc);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const loc = db
    .prepare('SELECT id FROM saved_locations WHERE id = ? AND user_id = ?')
    .get(Number(req.params.id), req.user.id);

  if (!loc) {
    return res.status(404).json({ error: 'Saved location not found' });
  }

  db.prepare('DELETE FROM saved_locations WHERE id = ?').run(Number(req.params.id));
  res.json({ message: 'Location deleted' });
});

module.exports = router;
