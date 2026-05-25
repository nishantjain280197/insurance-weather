const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireAdmin);

router.get('/', (req, res) => {
  const db = getDb();
  const users = db
    .prepare('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC')
    .all();
  res.json(users);
});

router.post('/', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (role && !['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Role must be "admin" or "user"' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)')
    .run(email, hashedPassword, role || 'user');

  res.status(201).json({
    id: result.lastInsertRowid,
    email,
    role: role || 'user',
    message: 'User created successfully',
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { email, password, role } = req.body;

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (email) {
    const existing = db
      .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
      .get(email, Number(id));
    if (existing) {
      return res.status(409).json({ error: 'Email already in use by another user' });
    }
  }

  const updatedEmail = email || user.email;
  const updatedRole = role || user.role;
  const updatedPassword = password ? bcrypt.hashSync(password, 10) : user.password;

  db.prepare('UPDATE users SET email = ?, password = ?, role = ? WHERE id = ?').run(
    updatedEmail,
    updatedPassword,
    updatedRole,
    Number(id)
  );

  res.json({
    id: Number(id),
    email: updatedEmail,
    role: updatedRole,
    message: 'User updated successfully',
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  if (Number(id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(Number(id));
  res.json({ message: 'User deleted successfully' });
});

router.post('/notify', (req, res) => {
  const { email, password, role, portalUrl } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const emailContent = {
    to: email,
    subject: 'Welcome to WeatherShield Portal',
    body: [
      `Hello,`,
      ``,
      `You have been invited to the WeatherShield Insurance Weather Portal.`,
      ``,
      `Your login credentials:`,
      `  Email: ${email}`,
      `  Password: ${password || '(set by admin)'}`,
      `  Role: ${role || 'user'}`,
      ``,
      portalUrl ? `Portal URL: ${portalUrl}` : '',
      ``,
      `Please change your password after your first login.`,
      ``,
      `— WeatherShield Admin`,
    ].filter(Boolean).join('\n'),
  };

  console.log('--- EMAIL NOTIFICATION (simulated) ---');
  console.log(`To: ${emailContent.to}`);
  console.log(`Subject: ${emailContent.subject}`);
  console.log(`Body:\n${emailContent.body}`);
  console.log('--- END EMAIL ---');

  res.json({
    success: true,
    message: `Welcome email queued for ${email}`,
    simulated: true,
    email: emailContent,
  });
});

module.exports = router;
