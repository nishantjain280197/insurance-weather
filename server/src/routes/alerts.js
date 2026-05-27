const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/', async (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    const pointUrl = `https://api.weather.gov/points/${latitude},${longitude}`;
    const pointRes = await fetch(pointUrl, {
      headers: { 'User-Agent': 'WeatherShield Insurance Portal (contact@weatherportal.com)' },
    });

    if (!pointRes.ok) {
      return res.json({ alerts: [], message: 'Location not covered by NWS' });
    }

    const pointData = await pointRes.json();
    const zoneId = pointData.properties?.forecastZone?.split('/').pop();
    const countyId = pointData.properties?.county?.split('/').pop();

    let alerts = [];

    if (zoneId) {
      const alertUrl = `https://api.weather.gov/alerts/active?zone=${zoneId}`;
      const alertRes = await fetch(alertUrl, {
        headers: { 'User-Agent': 'WeatherShield Insurance Portal (contact@weatherportal.com)' },
      });
      if (alertRes.ok) {
        const alertData = await alertRes.json();
        alerts = (alertData.features || []).map((f) => ({
          id: f.id,
          event: f.properties.event,
          severity: f.properties.severity,
          urgency: f.properties.urgency,
          headline: f.properties.headline,
          description: f.properties.description,
          instruction: f.properties.instruction,
          onset: f.properties.onset,
          expires: f.properties.expires,
          senderName: f.properties.senderName,
        }));
      }
    }

    if (countyId && alerts.length === 0) {
      const alertUrl = `https://api.weather.gov/alerts/active?zone=${countyId}`;
      const alertRes = await fetch(alertUrl, {
        headers: { 'User-Agent': 'WeatherShield Insurance Portal (contact@weatherportal.com)' },
      });
      if (alertRes.ok) {
        const alertData = await alertRes.json();
        alerts = (alertData.features || []).map((f) => ({
          id: f.id,
          event: f.properties.event,
          severity: f.properties.severity,
          urgency: f.properties.urgency,
          headline: f.properties.headline,
          description: f.properties.description,
          instruction: f.properties.instruction,
          onset: f.properties.onset,
          expires: f.properties.expires,
          senderName: f.properties.senderName,
        }));
      }
    }

    res.json({ alerts, zone: zoneId, county: countyId });
  } catch (error) {
    console.error('NWS alerts error:', error);
    res.json({ alerts: [], error: 'Failed to fetch alerts' });
  }
});

module.exports = router;
