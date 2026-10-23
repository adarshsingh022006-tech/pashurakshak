const express = require('express');
const router = express.Router();
const { z } = require('zod');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { predictRisk } = require('../ai/riskModel');
const { updateHotspots, getNearbyReportCount } = require('../ai/clusters');
const { getWeather } = require('../services/weatherService');
const { notifyHighRiskCase } = require('../services/notificationService');

const createReportSchema = z.object({
  animal_id: z.number().nullable().optional(),
  species: z.string().default('cow'),
  age: z.number().optional().default(2.0),
  symptoms: z.array(z.string()).min(1, 'Please select at least one symptom'),
  duration_days: z.number().min(1).default(1),
  vaccination_status: z.string().default('Vaccinated'),
  free_text_notes: z.string().nullable().optional(),
  photo_url: z.string().nullable().optional(),
  latitude: z.number().default(30.9010),
  longitude: z.number().default(75.8572),
  village: z.string().optional().default('Samrala'),
  district: z.string().optional().default('Ludhiana')
});

// POST /api/reports
router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = createReportSchema.parse(req.body);

    // 1. Fetch real or realistic environmental weather snapshot
    const weather = await getWeather(data.latitude, data.longitude);

    // 2. Fetch spatial cluster context (nearby cases in last 3 days)
    const { count: nearbyCases } = await getNearbyReportCount(db, data.latitude, data.longitude, 5.0, 3);

    // 3. Count recent herd mortality in this village/district
    const mortalityRecord = await db('mortality_reports')
      .where('village', data.village || '')
      .orWhere('district', data.district || '')
      .sum('count as totalMortality')
      .first();
    const herdMortality = parseInt(mortalityRecord?.totalMortality) || 0;

    // 4. Run AI Risk Engine (Random Forest with clinical fallback)
    const aiAssessment = predictRisk({
      species: data.species,
      symptoms: data.symptoms,
      age: data.age,
      vaccination_status: data.vaccination_status,
      duration_days: data.duration_days,
      herd_mortality_count: herdMortality,
      nearby_cases_count: nearbyCases,
      weather_temp: weather?.temp || 32,
      weather_humidity: weather?.humidity || 60
    });

    // 5. Generate unique non-colliding case number
    const allReports = await db('health_reports').select('report_number');
    let maxNum = 0;
    allReports.forEach(r => {
      const match = r.report_number && r.report_number.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const reportNumber = `Case #${String(maxNum + 1).padStart(4, '0')}`;

    // Human-in-the-loop: high risk starts in 'Under Review' until vet verifies
    const initialStatus = aiAssessment.riskLevel === 'High' ? 'Under Review' : 'New';

    const insertPayload = {
      report_number: reportNumber,
      user_id: req.user.id,
      animal_id: data.animal_id || null,
      species: data.species.toLowerCase(),
      age: data.age,
      symptoms: JSON.stringify(data.symptoms),
      duration_days: data.duration_days,
      vaccination_status: data.vaccination_status,
      free_text_notes: data.free_text_notes || null,
      photo_url: data.photo_url || null,
      latitude: data.latitude,
      longitude: data.longitude,
      village: data.village,
      district: data.district,
      risk_level: aiAssessment.riskLevel,
      ai_confidence: aiAssessment.confidence,
      ai_reason: aiAssessment.reason,
      contributing_factors: JSON.stringify(aiAssessment.contributingFactors),
      is_verified: false,
      status: initialStatus,
      is_escalated: false,
      weather_temp: weather?.temp || 32,
      weather_humidity: weather?.humidity || 60,
      weather_description: weather?.description || 'clear sky',
      weather_wind_speed: weather?.wind_speed || 10
    };

    const [reportId] = await db('health_reports').insert(insertPayload).returning('id');
    const id = typeof reportId === 'object' ? reportId.id : reportId;

    const createdReport = await db('health_reports').where('id', id).first();

    // 6. Trigger notifications if High Risk
    if (aiAssessment.riskLevel === 'High') {
      notifyHighRiskCase(createdReport);
    }

    // 7. Background update spatial cluster hotspots
    updateHotspots(db).catch(err => console.error('[Spatial Background Error]:', err));

    res.status(201).json({
      report: createdReport,
      aiAssessment,
      message: 'Health report registered and evaluated by AI risk classifier'
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || 'Validation error' });
    }
    console.error('[Reports POST Error]:', err);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// GET /api/reports
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { species, risk_level, status, search, days, limit = 100 } = req.query;

    let query = db('health_reports')
      .leftJoin('users', 'health_reports.user_id', 'users.id')
      .leftJoin('animals', 'health_reports.animal_id', 'animals.id')
      .select(
        'health_reports.*',
        'users.name as owner_name',
        'users.phone as owner_phone',
        'animals.name_or_tag as animal_tag'
      )
      .orderBy('health_reports.created_at', 'desc')
      .limit(parseInt(limit));

    // Optional 3-day window filter
    if (days) {
      const daysCount = parseInt(days) || 3;
      query = query.where('health_reports.created_at', '>=', db.raw(`datetime('now', '-${daysCount} days')`));
    }

    // If farmer, optionally show only their own reports if requested,
    // but allow viewing all community cases if surveillance mode is on
    if (req.user.role === 'farmer' && req.query.own_only === 'true') {
      query = query.where('health_reports.user_id', req.user.id);
    }

    if (species && species !== 'all') {
      query = query.where('health_reports.species', species.toLowerCase());
    }

    if (risk_level && risk_level !== 'all') {
      query = query.where('health_reports.risk_level', risk_level);
    }

    if (status && status !== 'all') {
      query = query.where('health_reports.status', status);
    }

    if (search) {
      query = query.where(builder => {
        builder
          .where('health_reports.report_number', 'like', `%${search}%`)
          .orWhere('health_reports.village', 'like', `%${search}%`)
          .orWhere('health_reports.species', 'like', `%${search}%`);
      });
    }

    const reports = await query;
    res.json({ reports });
  } catch (err) {
    console.error('[Reports GET Error]:', err);
    res.status(500).json({ error: 'Failed to list reports' });
  }
});

// GET /api/reports/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await db('health_reports')
      .leftJoin('users', 'health_reports.user_id', 'users.id')
      .leftJoin('animals', 'health_reports.animal_id', 'animals.id')
      .leftJoin('users as verifier', 'health_reports.verified_by', 'verifier.id')
      .select(
        'health_reports.*',
        'users.name as owner_name',
        'users.phone as owner_phone',
        'users.village as owner_village',
        'animals.name_or_tag as animal_tag',
        'animals.breed as animal_breed',
        'verifier.name as verifier_name'
      )
      .where('health_reports.id', req.params.id)
      .orWhere('health_reports.report_number', req.params.id)
      .first();

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Fetch visits and treatments
    const visits = await db('visits')
      .leftJoin('users', 'visits.vet_id', 'users.id')
      .select('visits.*', 'users.name as vet_name')
      .where('visits.report_id', report.id)
      .orderBy('visits.created_at', 'desc');

    const treatments = await db('treatments')
      .leftJoin('users', 'treatments.vet_id', 'users.id')
      .select('treatments.*', 'users.name as vet_name')
      .where('treatments.report_id', report.id)
      .orderBy('treatments.created_at', 'desc');

    res.json({ report, visits, treatments });
  } catch (err) {
    console.error('[Reports GET :id Error]:', err);
    res.status(500).json({ error: 'Failed to fetch case detail' });
  }
});

// PATCH /api/reports/:id/status (Vet or Authority)
router.patch('/:id/status', authenticateToken, requireRole(['vet', 'authority']), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['New', 'Under Review', 'Visit Scheduled', 'In Treatment', 'Resolved'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await db('health_reports')
      .where('id', req.params.id)
      .update({
        status,
        is_verified: true,
        verified_by: req.user.id,
        verified_at: db.fn.now(),
        updated_at: db.fn.now()
      });

    const updated = await db('health_reports').where('id', req.params.id).first();
    res.json({ report: updated, message: `Status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update report status' });
  }
});

// POST /api/reports/:id/treatment (Vet)
router.post('/:id/treatment', authenticateToken, requireRole(['vet', 'authority']), async (req, res) => {
  try {
    const { diagnosis, prescribed_medicines, dosage_instructions, notes, follow_up_date } = req.body;

    if (!diagnosis) {
      return res.status(400).json({ error: 'Diagnosis is required' });
    }

    const [treatmentId] = await db('treatments').insert({
      report_id: req.params.id,
      vet_id: req.user.id,
      diagnosis,
      prescribed_medicines,
      dosage_instructions,
      notes,
      follow_up_date
    }).returning('id');

    // Update report status to In Treatment
    await db('health_reports')
      .where('id', req.params.id)
      .update({
        status: 'In Treatment',
        is_verified: true,
        verified_by: req.user.id,
        verified_at: db.fn.now(),
        updated_at: db.fn.now()
      });

    // Notify farmer
    const report = await db('health_reports').where('id', req.params.id).first();
    if (report && report.user_id) {
      await db('notifications').insert({
        user_id: report.user_id,
        role_target: 'farmer',
        report_id: report.id,
        title: `💊 Treatment Prescribed for ${report.report_number}`,
        message: `Dr. ${req.user.name} has recorded treatment notes: ${diagnosis}. Check case details for dosage.`,
        type: 'treatment_update',
        is_read: false
      });
    }

    const treatment = await db('treatments').where('id', typeof treatmentId === 'object' ? treatmentId.id : treatmentId).first();
    res.status(201).json({ treatment, message: 'Treatment recorded successfully' });
  } catch (err) {
    console.error('[Treatment Error]:', err);
    res.status(500).json({ error: 'Failed to record treatment' });
  }
});

// POST /api/reports/:id/visit (Vet)
router.post('/:id/visit', authenticateToken, requireRole(['vet', 'authority']), async (req, res) => {
  try {
    const { scheduled_date, scheduled_time, notes } = req.body;

    if (!scheduled_date) {
      return res.status(400).json({ error: 'Visit date is required' });
    }

    const [visitId] = await db('visits').insert({
      report_id: req.params.id,
      vet_id: req.user.id,
      scheduled_date,
      scheduled_time: scheduled_time || '10:00 AM',
      status: 'scheduled',
      notes
    }).returning('id');

    // Update report status to Visit Scheduled
    await db('health_reports')
      .where('id', req.params.id)
      .update({
        status: 'Visit Scheduled',
        is_verified: true,
        verified_by: req.user.id,
        verified_at: db.fn.now(),
        updated_at: db.fn.now()
      });

    // Notify farmer
    const report = await db('health_reports').where('id', req.params.id).first();
    if (report && report.user_id) {
      await db('notifications').insert({
        user_id: report.user_id,
        role_target: 'farmer',
        report_id: report.id,
        title: `📅 Clinical Visit Scheduled for ${report.report_number}`,
        message: `A veterinarian has scheduled an on-site visit for ${scheduled_date} at ${scheduled_time || '10:00 AM'}.`,
        type: 'visit_update',
        is_read: false
      });
    }

    const visit = await db('visits').where('id', typeof visitId === 'object' ? visitId.id : visitId).first();
    res.status(201).json({ visit, message: 'Visit scheduled successfully' });
  } catch (err) {
    console.error('[Visit Error]:', err);
    res.status(500).json({ error: 'Failed to schedule visit' });
  }
});

// POST /api/reports/:id/escalate
router.post('/:id/escalate', authenticateToken, async (req, res) => {
  try {
    await db('health_reports')
      .where('id', req.params.id)
      .update({
        is_escalated: true,
        risk_level: 'High',
        updated_at: db.fn.now()
      });

    const report = await db('health_reports').where('id', req.params.id).first();

    // Alert all vets
    const vets = await db('users').where('role', 'vet');
    const alerts = vets.map(v => ({
      user_id: v.id,
      role_target: 'vet',
      report_id: report.id,
      title: `🚨 EMERGENCY ESCALATION: ${report.report_number}`,
      message: `Emergency escalation requested by ${req.user.name}. Rapid response team alert triggered.`,
      type: 'high_risk_alert',
      is_read: false
    }));

    if (alerts.length > 0) {
      await db('notifications').insert(alerts);
    }

    res.json({ message: 'Case successfully escalated to emergency priority', report });
  } catch (err) {
    res.status(500).json({ error: 'Failed to escalate case' });
  }
});

// POST /api/mortality
router.post('/mortality', authenticateToken, async (req, res) => {
  try {
    const { species, count, suspected_cause, symptoms, date_of_death, latitude, longitude, village, district, notes } = req.body;

    const [mortalityId] = await db('mortality_reports').insert({
      user_id: req.user.id,
      species: species || 'cow',
      count: parseInt(count) || 1,
      suspected_cause: suspected_cause || 'Unknown sudden illness',
      symptoms: JSON.stringify(symptoms || []),
      date_of_death: date_of_death || new Date().toISOString().split('T')[0],
      latitude: parseFloat(latitude) || 30.9010,
      longitude: parseFloat(longitude) || 75.8572,
      village: village || 'Samrala',
      district: district || 'Ludhiana',
      notes: notes || null
    }).returning('id');

    // Notify vets of mortality
    const vets = await db('users').where('role', 'vet');
    if (vets.length > 0) {
      await db('notifications').insert(vets.map(v => ({
        user_id: v.id,
        role_target: 'vet',
        title: `⚠️ Livestock Mortality Reported (${count} ${species})`,
        message: `Mortality alert logged in ${village || 'village'}. Suspected cause: ${suspected_cause || 'Not specified'}.`,
        type: 'high_risk_alert',
        is_read: false
      })));
    }

    // Refresh hotspots
    updateHotspots(db).catch(console.error);

    const record = await db('mortality_reports').where('id', typeof mortalityId === 'object' ? mortalityId.id : mortalityId).first();
    res.status(201).json({ mortality: record, message: 'Mortality report registered' });
  } catch (err) {
    console.error('[Mortality Error]:', err);
    res.status(500).json({ error: 'Failed to record mortality' });
  }
});

// GET /api/mortality
router.get('/mortality', authenticateToken, async (req, res) => {
  try {
    const records = await db('mortality_reports')
      .leftJoin('users', 'mortality_reports.user_id', 'users.id')
      .select('mortality_reports.*', 'users.name as reporter_name')
      .orderBy('mortality_reports.created_at', 'desc');

    res.json({ mortality_reports: records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mortality records' });
  }
});

module.exports = router;
