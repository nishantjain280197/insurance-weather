const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

const DEFAULT_THRESHOLDS = {
  wind_speed_mph: 58,
  wind_severe_mph: 65,
  wind_extreme_mph: 75,
  rain_minor_inches: 2.0,
  rain_moderate_inches: 3.0,
  rain_severe_inches: 4.0,
  hail_codes: '96,99',
  thunderstorm_codes: '95,96,99',
  winter_storm_codes: '71,73,75,77,85,86',
  ice_storm_codes: '56,57,66,67',
  winter_temp_max_f: 32,
  tornado_wind_mph: 75,
};

router.get('/', (req, res) => {
  const db = getDb();
  const thresholds = db.prepare('SELECT * FROM peril_thresholds ORDER BY id DESC LIMIT 1').get();
  if (!thresholds) {
    return res.json(DEFAULT_THRESHOLDS);
  }
  const { id, updated_by, updated_at, ...data } = thresholds;
  res.json(data);
});

router.put('/', requireAdmin, (req, res) => {
  const db = getDb();
  const fields = [
    'wind_speed_mph', 'wind_severe_mph', 'wind_extreme_mph',
    'rain_minor_inches', 'rain_moderate_inches', 'rain_severe_inches',
    'hail_codes', 'thunderstorm_codes', 'winter_storm_codes', 'ice_storm_codes',
    'winter_temp_max_f', 'tornado_wind_mph',
  ];

  const values = {};
  fields.forEach((f) => {
    values[f] = req.body[f] !== undefined ? req.body[f] : DEFAULT_THRESHOLDS[f];
  });

  const existing = db.prepare('SELECT id FROM peril_thresholds LIMIT 1').get();
  if (existing) {
    const setClause = fields.map((f) => `${f} = @${f}`).join(', ');
    db.prepare(`UPDATE peril_thresholds SET ${setClause}, updated_by = @updated_by, updated_at = CURRENT_TIMESTAMP WHERE id = @id`).run({
      ...values,
      updated_by: req.user.id,
      id: existing.id,
    });
  } else {
    const cols = [...fields, 'updated_by'].join(', ');
    const placeholders = [...fields, 'updated_by'].map((f) => `@${f}`).join(', ');
    db.prepare(`INSERT INTO peril_thresholds (${cols}) VALUES (${placeholders})`).run({
      ...values,
      updated_by: req.user.id,
    });
  }

  res.json({ message: 'Thresholds updated successfully', thresholds: values });
});

router.post('/reset', requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM peril_thresholds').run();
  res.json({ message: 'Thresholds reset to defaults', thresholds: DEFAULT_THRESHOLDS });
});

module.exports = router;
module.exports.DEFAULT_THRESHOLDS = DEFAULT_THRESHOLDS;
