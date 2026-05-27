const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { fetchWeatherData, generateInsights } = require('../services/weatherService');
const { logAudit } = require('./audit');

const router = express.Router();
router.use(authenticateToken);

router.post('/upload', async (req, res) => {
  const { rows } = req.body;

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No rows provided' });
  }

  if (rows.length > 50) {
    return res.status(400).json({ error: 'Maximum 50 addresses per batch' });
  }

  const results = [];
  const db = getDb();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const { city, state, latitude, longitude, date_of_loss, street_address, zipcode } = row;

    if (!city || !state || !latitude || !longitude || !date_of_loss) {
      results.push({
        index: i,
        status: 'error',
        error: 'Missing required fields (city, state, latitude, longitude, date_of_loss)',
        input: row,
      });
      continue;
    }

    const endDate = date_of_loss;
    const dolDate = new Date(date_of_loss);
    const startDateObj = new Date(dolDate);
    startDateObj.setFullYear(startDateObj.getFullYear() - 3);
    const startDate = startDateObj.toISOString().split('T')[0];

    try {
      const weatherDays = await fetchWeatherData(latitude, longitude, startDate, endDate);
      const insights = generateInsights(weatherDays, date_of_loss);

      db.prepare(
        `INSERT INTO search_history 
         (user_id, street_address, city, state, zipcode, latitude, longitude, date_of_loss, start_date, end_date, results)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
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

      results.push({
        index: i,
        status: 'success',
        location: `${city}, ${state}`,
        summary: {
          total_days: insights.summary.total_days,
          peril_days: insights.summary.peril_days,
          peril_percentage: insights.summary.peril_percentage,
          max_wind_gust: insights.summary.max_wind_gust,
        },
      });
    } catch (error) {
      results.push({
        index: i,
        status: 'error',
        error: error.message,
        input: row,
      });
    }
  }

  const successCount = results.filter((r) => r.status === 'success').length;
  logAudit(
    req.user.id,
    req.user.email,
    'BATCH_UPLOAD',
    `Processed ${rows.length} addresses: ${successCount} success, ${rows.length - successCount} failed`,
    req.ip
  );

  res.json({
    total: rows.length,
    success: successCount,
    failed: rows.length - successCount,
    results,
  });
});

module.exports = router;
