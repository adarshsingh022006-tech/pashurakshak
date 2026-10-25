const bcrypt = require('bcryptjs');
const db = require('./index');

async function seed() {
  console.log('[DB Seed] Checking if seeding is required...');

  // Check if users already seeded
  const existingUsers = await db('users').count('id as count').first();
  if (existingUsers && parseInt(existingUsers.count) > 0) {
    console.log('[DB Seed] Database already contains records. Skipping initial seeding.');
    return;
  }

  console.log('[DB Seed] Populating demo dataset...');

  const passwordHash = await bcrypt.hash('Demo@123', 10);

  // 1. Seed Demo Users
  const [farmerId] = await db('users').insert({
    name: 'Gurdeep Singh',
    email: 'farmer@demo.com',
    password_hash: passwordHash,
    role: 'farmer',
    phone: '+91 98765 43210',
    village: 'Samrala',
    district: 'Ludhiana',
    state: 'Punjab'
  }).returning('id');

  const [vetId] = await db('users').insert({
    name: 'Dr. Amritpal Singh (Senior Veterinary Officer)',
    email: 'vet@demo.com',
    password_hash: passwordHash,
    role: 'vet',
    phone: '+91 98123 45678',
    village: 'Civil Lines',
    district: 'Ludhiana',
    state: 'Punjab'
  }).returning('id');

  const [govtId] = await db('users').insert({
    name: 'Dr. Ravneet Kaur (State Surveillance Director)',
    email: 'govt@demo.com',
    password_hash: passwordHash,
    role: 'authority',
    phone: '+91 98456 78901',
    village: 'Directorate of Animal Husbandry',
    district: 'Ludhiana',
    state: 'Punjab'
  }).returning('id');

  // Additional mock farmer for distributed cases
  const [farmer2Id] = await db('users').insert({
    name: 'Harbhajan Ram',
    email: 'harbhajan@demo.com',
    password_hash: passwordHash,
    role: 'farmer',
    phone: '+91 97111 22334',
    village: 'Doraha',
    district: 'Ludhiana',
    state: 'Punjab'
  }).returning('id');

  // SQLite returns row id directly or object depending on driver
  const fId = typeof farmerId === 'object' ? farmerId.id : farmerId || 1;
  const vId = typeof vetId === 'object' ? vetId.id : vetId || 2;
  const gId = typeof govtId === 'object' ? govtId.id : govtId || 3;
  const f2Id = typeof farmer2Id === 'object' ? farmer2Id.id : farmer2Id || 4;

  // 2. Seed Animals for Farmer
  const [animal36Id] = await db('animals').insert({
    user_id: fId,
    name_or_tag: '0036',
    species: 'cow',
    age: 3,
    sex: 'female',
    breed: 'Sahiwal Indigenous',
    vaccination_status: 'Vaccinated'
  }).returning('id');

  const [animalB1Id] = await db('animals').insert({
    user_id: fId,
    name_or_tag: 'B-204',
    species: 'buffalo',
    age: 5,
    sex: 'female',
    breed: 'Murrah',
    vaccination_status: 'Vaccinated'
  }).returning('id');

  const [animalG1Id] = await db('animals').insert({
    user_id: fId,
    name_or_tag: 'G-102',
    species: 'goat',
    age: 3,
    sex: 'male',
    breed: 'Beetal',
    vaccination_status: 'Vaccinated'
  }).returning('id');

  const [animalC2Id] = await db('animals').insert({
    user_id: fId,
    name_or_tag: 'C-412',
    species: 'cow',
    age: 4,
    sex: 'female',
    breed: 'Holstein Friesian Cross',
    vaccination_status: 'Partially Vaccinated'
  }).returning('id');

  const [animalS1Id] = await db('animals').insert({
    user_id: f2Id,
    name_or_tag: 'S-089',
    species: 'sheep',
    age: 2,
    sex: 'female',
    breed: 'Lohi',
    vaccination_status: 'Unvaccinated'
  }).returning('id');

  const a36Id = typeof animal36Id === 'object' ? animal36Id.id : animal36Id || 1;

  // 3. Seed Outbreak Cluster (Ludhiana East / Samrala Zone)
  // EXACT MATCH: 28 reports in this area, of which exactly 7 are High Risk!
  const clusterReports = [];
  const clusterCenterLat = 30.9010;
  const clusterCenterLng = 75.8572;

  // Primary Case: "COW – Case #0036"
  clusterReports.push({
    report_number: 'Case #0036',
    user_id: fId,
    animal_id: a36Id,
    species: 'cow',
    age: 3,
    symptoms: JSON.stringify(['fever', 'difficulty_walking', 'salivation']),
    duration_days: 2,
    vaccination_status: 'Vaccinated',
    free_text_notes: 'Sudden onset of high fever and excessive foaming/salivation. Struggling to stand and lethargic.',
    latitude: 30.9012,
    longitude: 75.8575,
    village: 'Samrala',
    district: 'Ludhiana',
    risk_level: 'High',
    ai_confidence: 0.94,
    ai_reason: 'Presentation of acute pyrexia (fever) combined with excessive salivation and locomotor distress in cattle indicates high probability of vesicular disease / FMD episode within an active surveillance cluster.',
    contributing_factors: JSON.stringify([
      'Acute pyrexia accompanied by oral salivation or lameness (vesicular/FMD profile)',
      'Multiple concurrent symptoms reported (3 active clinical signs)',
      'High spatial density: 7 active cases reported in immediate 5km vicinity'
    ]),
    is_verified: true,
    verified_by: vId,
    verified_at: new Date(Date.now() - 3600 * 1000 * 4),
    status: 'Visit Scheduled',
    is_escalated: false,
    weather_temp: 33.0,
    weather_humidity: 62.0,
    weather_description: 'clear sky',
    weather_wind_speed: 12.0,
    created_at: new Date(Date.now() - 3600 * 1000 * 18),
    updated_at: new Date(Date.now() - 3600 * 1000 * 4)
  });

  // 6 additional HIGH-RISK cases in the cluster (Total High in cluster = 7)
  const highRiskTemplates = [
    { num: 'Case #0012', species: 'buffalo', age: 6, sym: ['fever', 'salivation', 'swelling'], days: 3, vacc: 'Unvaccinated', notes: 'Submandibular swelling and severe salivation.' },
    { num: 'Case #0019', species: 'cow', age: 4, sym: ['fever', 'difficulty_walking', 'skin_lesions'], days: 2, vacc: 'Partially Vaccinated', notes: 'Vesicular lesions observed on interdigital pouch and dental pad.' },
    { num: 'Case #0023', species: 'cow', age: 4, sym: ['fever', 'coughing', 'nasal_discharge'], days: 4, vacc: 'Unvaccinated', notes: 'Rapid laboured breathing with mucoid nasal discharge.' },
    { num: 'Case #0029', species: 'buffalo', age: 6, sym: ['fever', 'salivation', 'lameness'], days: 2, vacc: 'Vaccinated', notes: 'Refusing feed, excessive drooling, hind limb stiffness.' },
    { num: 'Case #0031', species: 'goat', age: 2, sym: ['fever', 'diarrhea', 'nasal_discharge'], days: 3, vacc: 'Unvaccinated', notes: 'Suspected PPR syndrome; high mortality in local goat pen.' },
    { num: 'Case #0034', species: 'cow', age: 3, sym: ['fever', 'difficulty_walking', 'salivation'], days: 1, vacc: 'Partially Vaccinated', notes: 'Acute shivering, foam at mouth, unable to walk to shed.' },
  ];

  highRiskTemplates.forEach((t, i) => {
    const lat = clusterCenterLat + (Math.sin(i * 1.1) * 0.025);
    const lng = clusterCenterLng + (Math.cos(i * 1.1) * 0.025);
    clusterReports.push({
      report_number: t.num,
      user_id: i % 2 === 0 ? fId : f2Id,
      species: t.species,
      age: t.age,
      symptoms: JSON.stringify(t.sym),
      duration_days: t.days,
      vaccination_status: t.vacc,
      free_text_notes: t.notes,
      latitude: Number(lat.toFixed(4)),
      longitude: Number(lng.toFixed(4)),
      village: 'Samrala',
      district: 'Ludhiana',
      risk_level: 'High',
      ai_confidence: 0.91,
      ai_reason: `Severe clinical indicators: ${t.sym.join(', ')} detected in high-density surveillance radius.`,
      contributing_factors: JSON.stringify(['Active cluster proximity', 'Critical symptom combination']),
      is_verified: i < 3,
      verified_by: i < 3 ? vId : null,
      status: i === 0 ? 'In Treatment' : (i === 1 ? 'Visit Scheduled' : 'Under Review'),
      is_escalated: i === 2,
      weather_temp: 33.0,
      weather_humidity: 60.0,
      weather_description: 'clear sky',
      weather_wind_speed: 11.0,
      created_at: new Date(Date.now() - (i + 1) * 86400 * 1000 * 0.8),
      updated_at: new Date(Date.now() - (i + 1) * 86400 * 1000 * 0.8)
    });
  });

  // 21 MEDIUM and LOW risk cases in the cluster (Total reports in cluster = 1 + 6 + 21 = 28!)
  for (let i = 1; i <= 21; i++) {
    const isMedium = i <= 14;
    const caseNum = `Case #${String(40 + i).padStart(4, '0')}`;
    const angle = (i / 21) * 2 * Math.PI;
    const dist = 0.015 + (i % 5) * 0.005; // tightly clustered within ~3-4 km
    const lat = clusterCenterLat + Math.sin(angle) * dist;
    const lng = clusterCenterLng + Math.cos(angle) * dist;
    const species = ['cow', 'buffalo', 'goat', 'sheep'][i % 4];

    const sym = isMedium
      ? (i % 2 === 0 ? ['loss_of_appetite', 'diarrhea'] : ['coughing', 'loss_of_appetite'])
      : (i % 2 === 0 ? ['loss_of_appetite'] : ['lameness']);

    clusterReports.push({
      report_number: caseNum,
      user_id: i % 3 === 0 ? fId : f2Id,
      species,
      age: 2 + (i % 6),
      symptoms: JSON.stringify(sym),
      duration_days: 1 + (i % 3),
      vaccination_status: i % 2 === 0 ? 'Vaccinated' : 'Partially Vaccinated',
      free_text_notes: isMedium ? 'Animal showed reduced feed intake and mild lethargy.' : 'Minor hoof abrasion noticed during milking.',
      latitude: Number(lat.toFixed(4)),
      longitude: Number(lng.toFixed(4)),
      village: i % 2 === 0 ? 'Samrala' : 'Khamanon',
      district: 'Ludhiana',
      risk_level: isMedium ? 'Medium' : 'Low',
      ai_confidence: 0.86,
      ai_reason: isMedium ? 'Moderate symptomatic markers with stable vital profile.' : 'Isolated minor symptom with normal appetite and immunization.',
      contributing_factors: JSON.stringify(isMedium ? ['Moderate appetite depression'] : ['Isolated symptom']),
      is_verified: i % 4 === 0,
      verified_by: i % 4 === 0 ? vId : null,
      status: i % 5 === 0 ? 'Resolved' : (isMedium ? 'New' : 'Under Review'),
      is_escalated: false,
      weather_temp: 32.5,
      weather_humidity: 61.0,
      weather_description: 'clear sky',
      weather_wind_speed: 12.0,
      created_at: new Date(Date.now() - (i % 7 + 1) * 86400 * 1000 * 0.9),
      updated_at: new Date(Date.now() - (i % 7 + 1) * 86400 * 1000 * 0.9)
    });
  }

  // 4. Additional 11 reports scattered across Punjab to reach ~39-40 total cases
  // (3 High, 5 Medium, 3 Low)
  const scatteredReports = [
    { num: 'Case #0002', loc: [30.7046, 76.7179], vill: 'Mohali', sp: 'cow', risk: 'Medium', sym: ['coughing'], stat: 'Resolved' },
    { num: 'Case #0005', loc: [30.3400, 76.3800], vill: 'Patiala Rural', sp: 'buffalo', risk: 'High', sym: ['fever', 'swelling', 'difficulty_walking'], stat: 'In Treatment' },
    { num: 'Case #0008', loc: [31.3260, 75.5762], vill: 'Jalandhar Cantt', sp: 'cow', risk: 'Low', sym: ['lameness'], stat: 'Resolved' },
    { num: 'Case #0015', loc: [30.7600, 75.5200], vill: 'Jagraon', sp: 'goat', risk: 'High', sym: ['fever', 'diarrhea', 'nasal_discharge'], stat: 'Visit Scheduled' },
    { num: 'Case #0018', loc: [30.6500, 75.8000], vill: 'Raikot', sp: 'cow', risk: 'Medium', sym: ['loss_of_appetite', 'coughing'], stat: 'New' },
    { num: 'Case #0022', loc: [30.7100, 76.2200], vill: 'Fatehgarh Sahib', sp: 'buffalo', risk: 'High', sym: ['fever', 'salivation'], stat: 'Under Review' },
    { num: 'Case #0025', loc: [30.2800, 76.1000], vill: 'Nabha', sp: 'sheep', risk: 'Medium', sym: ['loss_of_appetite'], stat: 'New' },
    { num: 'Case #0028', loc: [31.1400, 75.3400], vill: 'Nakodar', sp: 'poultry', risk: 'Medium', sym: ['diarrhea'], stat: 'Under Review' },
    { num: 'Case #0033', loc: [30.8200, 76.0100], vill: 'Khanna', sp: 'cow', risk: 'Low', sym: ['skin_lesions'], stat: 'Resolved' },
    { num: 'Case #0038', loc: [30.9800, 75.6800], vill: 'Mullanpur', sp: 'buffalo', risk: 'Medium', sym: ['coughing', 'nasal_discharge'], stat: 'New' },
    { num: 'Case #0040', loc: [30.5500, 75.8500], vill: 'Ahmedgarh', sp: 'goat', risk: 'Low', sym: ['lameness'], stat: 'Resolved' },
  ];

  scatteredReports.forEach((sr, idx) => {
    clusterReports.push({
      report_number: sr.num,
      user_id: fId,
      species: sr.sp,
      age: 3,
      symptoms: JSON.stringify(sr.sym),
      duration_days: 2,
      vaccination_status: 'Vaccinated',
      free_text_notes: `Periodic surveillance report submitted from ${sr.vill}.`,
      latitude: sr.loc[0],
      longitude: sr.loc[1],
      village: sr.vill,
      district: 'Ludhiana',
      risk_level: sr.risk,
      ai_confidence: 0.88,
      ai_reason: `${sr.risk} risk profile flagged based on clinical signs.`,
      contributing_factors: JSON.stringify([`${sr.sym.join(', ')} presentation`]),
      is_verified: sr.stat === 'In Treatment' || sr.stat === 'Resolved',
      verified_by: vId,
      status: sr.stat,
      is_escalated: false,
      weather_temp: 31.0,
      weather_humidity: 55.0,
      weather_description: 'haze',
      weather_wind_speed: 10.0,
      created_at: new Date(Date.now() - (idx + 3) * 86400 * 1000),
      updated_at: new Date(Date.now() - (idx + 3) * 86400 * 1000)
    });
  });

  // Insert all 39 health reports
  await db('health_reports').insert(clusterReports);
  console.log(`[DB Seed] Inserted ${clusterReports.length} health reports (Total cases: 39).`);

  // Get Case #0036 id for linking visit & treatment
  const case36 = await db('health_reports').where('report_number', 'Case #0036').first();

  // 5. Seed Hotspot in database
  // EXACT POPUP: "Possible Outbreak Hotspot — Reports in this area: 28 — High-risk reports: 7 — Detection radius: 5 km"
  await db('hotspots').insert({
    name: 'Possible Outbreak Hotspot',
    center_lat: 30.9010,
    center_lng: 75.8572,
    radius_km: 5.0,
    total_reports: 28,
    high_risk_reports: 7,
    dominant_symptoms: JSON.stringify(['fever', 'salivation', 'difficulty_walking']),
    status: 'active',
    detected_at: new Date(Date.now() - 86400 * 1000 * 2),
    updated_at: new Date()
  });
  console.log('[DB Seed] Inserted Outbreak Hotspot (28 reports, 7 high-risk, radius 5 km).');

  // 6. Seed Scheduled Visit for Case #0036
  if (case36) {
    await db('visits').insert({
      report_id: case36.id,
      vet_id: vId,
      scheduled_date: new Date(Date.now() + 86400 * 1000).toISOString().split('T')[0],
      scheduled_time: '10:30 AM',
      status: 'scheduled',
      notes: 'Urgent mobile veterinary unit dispatched for vesicular lesions assessment and ring vaccination protocol.'
    });
    console.log('[DB Seed] Seeded scheduled visit for Case #0036.');
  }

  // 7. Seed Sample Treatment
  const case12 = await db('health_reports').where('report_number', 'Case #0012').first();
  if (case12) {
    await db('treatments').insert({
      report_id: case12.id,
      vet_id: vId,
      diagnosis: 'Suspected Foot and Mouth Disease (FMD) with secondary bacterial stomatitis',
      prescribed_medicines: 'Boro-glycerine oral paint, Flunixin Meglumine (anti-inflammatory), Enrofloxacin (10%)',
      dosage_instructions: 'Oral paint twice daily after potassium permanganate mouth wash; NSAID 15ml IM for 3 days.',
      notes: 'Advised strict herd isolation, foot bath with 4% sodium carbonate, milk disposal.',
      follow_up_date: new Date(Date.now() + 86400 * 1000 * 3).toISOString().split('T')[0]
    });
  }

  // 8. Seed Mortality Reports
  await db('mortality_reports').insert([
    {
      user_id: fId,
      species: 'cow',
      count: 2,
      suspected_cause: 'Acute sudden fever & recumbency (suspected HS)',
      symptoms: JSON.stringify(['fever', 'swelling', 'difficulty_walking']),
      date_of_death: new Date(Date.now() - 86400 * 1000 * 3).toISOString().split('T')[0],
      latitude: 30.8950,
      longitude: 75.8450,
      village: 'Samrala',
      district: 'Ludhiana',
      notes: 'Two adult milch cows died within 12 hours of developing high fever and throat swelling.'
    },
    {
      user_id: f2Id,
      species: 'buffalo',
      count: 1,
      suspected_cause: 'Respiratory distress & toxemia',
      symptoms: JSON.stringify(['fever', 'coughing']),
      date_of_death: new Date(Date.now() - 86400 * 1000 * 5).toISOString().split('T')[0],
      latitude: 30.9120,
      longitude: 75.8710,
      village: 'Doraha',
      district: 'Ludhiana',
      notes: 'Buffalo showed severe distress followed by collapse.'
    }
  ]);

  // 9. Seed Initial Notifications
  await db('notifications').insert([
    {
      user_id: vId,
      role_target: 'vet',
      report_id: case36 ? case36.id : 1,
      title: '🚨 High-Risk Case Alert: COW (Case #0036)',
      message: 'High-risk case reported at Samrala (Ludhiana) requiring priority veterinary action: Presentation of acute pyrexia with excessive salivation.',
      type: 'high_risk_alert',
      is_read: false,
      created_at: new Date(Date.now() - 3600 * 1000 * 18)
    },
    {
      user_id: fId,
      role_target: 'farmer',
      report_id: case36 ? case36.id : 1,
      title: '📅 Visit Scheduled for Case #0036',
      message: 'Dr. Amritpal Singh has scheduled an on-site clinical visit for your animal on tomorrow at 10:30 AM.',
      type: 'visit_update',
      is_read: false,
      created_at: new Date(Date.now() - 3600 * 1000 * 4)
    },
    {
      user_id: fId,
      role_target: 'farmer',
      title: '⚡ Possible Outbreak Hotspot Warning',
      message: 'Surveillance alert: 28 reports (7 high-risk) detected in your 5 km radius. Ring vaccination recommended.',
      type: 'hotspot_warning',
      is_read: false,
      created_at: new Date(Date.now() - 3600 * 1000 * 24)
    }
  ]);

  console.log('[DB Seed] Complete demo dataset seeded successfully!');
}

module.exports = seed;
