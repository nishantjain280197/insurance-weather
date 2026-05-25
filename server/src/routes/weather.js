const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { fetchWeatherData, generateInsights } = require('../services/weatherService');

const router = express.Router();

router.use(authenticateToken);

router.post('/search', async (req, res) => {
  const { street_address, city, state, zipcode, latitude, longitude, date_of_loss } = req.body;

  if (!city || !state || !latitude || !longitude || !date_of_loss) {
    return res.status(400).json({
      error: 'City, state, latitude, longitude, and date of loss are required',
    });
  }

  const endDate = date_of_loss;
  const dolDate = new Date(date_of_loss);
  const startDateObj = new Date(dolDate);
  startDateObj.setFullYear(startDateObj.getFullYear() - 3);
  const startDate = startDateObj.toISOString().split('T')[0];

  try {
    const weatherDays = await fetchWeatherData(latitude, longitude, startDate, endDate);
    const insights = generateInsights(weatherDays, date_of_loss);

    const db = getDb();
    const result = db
      .prepare(
        `INSERT INTO search_history 
         (user_id, street_address, city, state, zipcode, latitude, longitude, date_of_loss, start_date, end_date, results)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.user.id,
        street_address || '',
        city,
        state,
        zipcode || '',
        latitude,
        longitude,
        date_of_loss,
        startDate,
        endDate,
        JSON.stringify({ days: weatherDays, insights })
      );

    res.json({
      id: result.lastInsertRowid,
      location: { street_address, city, state, zipcode, latitude, longitude },
      date_range: { start_date: startDate, end_date: endDate, date_of_loss },
      insights,
      days: weatherDays,
    });
  } catch (error) {
    console.error('Weather search error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch weather data' });
  }
});

router.get('/history', (req, res) => {
  const db = getDb();
  const history = db
    .prepare(
      `SELECT id, street_address, city, state, zipcode, latitude, longitude, 
              date_of_loss, start_date, end_date, created_at 
       FROM search_history 
       WHERE user_id = ? 
       ORDER BY created_at DESC`
    )
    .all(req.user.id);

  res.json(history);
});

router.get('/history/:id', (req, res) => {
  const db = getDb();
  const record = db
    .prepare('SELECT * FROM search_history WHERE id = ? AND user_id = ?')
    .get(Number(req.params.id), req.user.id);

  if (!record) {
    return res.status(404).json({ error: 'Search record not found' });
  }

  const results = JSON.parse(record.results);
  res.json({
    id: record.id,
    location: {
      street_address: record.street_address,
      city: record.city,
      state: record.state,
      zipcode: record.zipcode,
      latitude: record.latitude,
      longitude: record.longitude,
    },
    date_range: {
      start_date: record.start_date,
      end_date: record.end_date,
      date_of_loss: record.date_of_loss,
    },
    insights: results.insights,
    days: results.days,
    created_at: record.created_at,
  });
});

router.delete('/history/:id', (req, res) => {
  const db = getDb();
  const record = db
    .prepare('SELECT id FROM search_history WHERE id = ? AND user_id = ?')
    .get(Number(req.params.id), req.user.id);

  if (!record) {
    return res.status(404).json({ error: 'Search record not found' });
  }

  db.prepare('DELETE FROM search_history WHERE id = ?').run(Number(req.params.id));
  res.json({ message: 'Search record deleted successfully' });
});

module.exports = router;
