const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { logAudit } = require('./audit');

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  const db = getDb();
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = 'SELECT * FROM claims WHERE user_id = ?';
  const params = [req.user.id];

  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const claims = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM claims WHERE user_id = ?').get(req.user.id);

  res.json({ claims, total: total.count, page: parseInt(page), limit: parseInt(limit) });
});

router.get('/stats', (req, res) => {
  const db = getDb();
  const stats = {
    total: db.prepare('SELECT COUNT(*) as count FROM claims WHERE user_id = ?').get(req.user.id).count,
    open: db.prepare("SELECT COUNT(*) as count FROM claims WHERE user_id = ? AND status = 'open'").get(req.user.id).count,
    under_review: db.prepare("SELECT COUNT(*) as count FROM claims WHERE user_id = ? AND status = 'under_review'").get(req.user.id).count,
    approved: db.prepare("SELECT COUNT(*) as count FROM claims WHERE user_id = ? AND status = 'approved'").get(req.user.id).count,
    denied: db.prepare("SELECT COUNT(*) as count FROM claims WHERE user_id = ? AND status = 'denied'").get(req.user.id).count,
    closed: db.prepare("SELECT COUNT(*) as count FROM claims WHERE user_id = ? AND status = 'closed'").get(req.user.id).count,
  };
  const totalClaimed = db.prepare('SELECT COALESCE(SUM(amount_claimed), 0) as total FROM claims WHERE user_id = ?').get(req.user.id).total;
  const totalApproved = db.prepare('SELECT COALESCE(SUM(amount_approved), 0) as total FROM claims WHERE user_id = ?').get(req.user.id).total;
  res.json({ ...stats, total_claimed: totalClaimed, total_approved: totalApproved });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { claim_number, policy_number, claimant_name, city, state, date_of_loss, peril_type, status, amount_claimed, notes, search_history_id } = req.body;

  if (!claim_number) {
    return res.status(400).json({ error: 'Claim number is required' });
  }

  try {
    const result = db.prepare(
      `INSERT INTO claims (user_id, claim_number, policy_number, claimant_name, city, state, date_of_loss, peril_type, status, amount_claimed, notes, search_history_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      req.user.id, claim_number, policy_number || null, claimant_name || null,
      city || null, state || null, date_of_loss || null, peril_type || null,
      status || 'open', amount_claimed || null, notes || null, search_history_id || null
    );

    logAudit(req.user.id, req.user.email, 'CLAIM_CREATE', `Claim ${claim_number}`, req.ip);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Claim created' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Claim number already exists' });
    }
    res.status(500).json({ error: 'Failed to create claim' });
  }
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const claim = db.prepare('SELECT * FROM claims WHERE id = ? AND user_id = ?').get(Number(req.params.id), req.user.id);
  if (!claim) return res.status(404).json({ error: 'Claim not found' });

  const { status, amount_approved, notes } = req.body;
  const updates = [];
  const params = [];

  if (status) { updates.push('status = ?'); params.push(status); }
  if (amount_approved !== undefined) { updates.push('amount_approved = ?'); params.push(amount_approved); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
  updates.push('updated_at = CURRENT_TIMESTAMP');

  if (updates.length === 1) return res.status(400).json({ error: 'No fields to update' });

  params.push(Number(req.params.id));
  db.prepare(`UPDATE claims SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  logAudit(req.user.id, req.user.email, 'CLAIM_UPDATE', `Claim ${claim.claim_number} → ${status || 'updated'}`, req.ip);
  res.json({ message: 'Claim updated' });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const claim = db.prepare('SELECT * FROM claims WHERE id = ? AND user_id = ?').get(Number(req.params.id), req.user.id);
  if (!claim) return res.status(404).json({ error: 'Claim not found' });

  db.prepare('DELETE FROM claims WHERE id = ?').run(Number(req.params.id));
  logAudit(req.user.id, req.user.email, 'CLAIM_DELETE', `Claim ${claim.claim_number}`, req.ip);
  res.json({ message: 'Claim deleted' });
});

module.exports = router;
