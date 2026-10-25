// Client-Side Mock Backend & Data Engine for Standalone Cloud & Offline Deployment
// Provides persistent state in localStorage and exact clinical AI risk scoring
import { NEARBY_VETS, MOBILE_VET_UNITS } from '../data/nearbyVetsData';

const STORAGE_KEY = 'pashurakshak_cloud_state_v5';

// 10 Core livestock clinical symptoms
export const SYMPTOMS_LIST = [
  'fever',
  'coughing',
  'difficulty_walking',
  'salivation',
  'loss_of_appetite',
  'diarrhea',
  'skin_lesions',
  'nasal_discharge',
  'lameness',
  'swelling'
];

// Multilingual Voice Symptom Dictionary (English, Hindi, Punjabi)
export const VOICE_SYMPTOM_DICTIONARY = {
  fever: [
    'fever', 'temperature', 'pyrexia', 'hot body', 'warm',
    'bukhar', 'bukhaar', 'taap', 'tapman', 'garam', 'jwar',
    'tāp', 'bukhaar hai'
  ],
  coughing: [
    'cough', 'coughing', 'wheezing', 'breath sounds',
    'khansi', 'khānsī', 'khokh', 'khans raha', 'khansi aa rahi',
    'khangh', 'khang'
  ],
  difficulty_walking: [
    'difficulty walking', 'unable to walk', 'cannot stand', 'struggling to walk', 'staggering',
    'chalne mein dikkat', 'chal nahi pa raha', 'khada nahi ho raha', 'ladkhada',
    'turn vich mushkil', 'turn nahi sakda', 'khalo nahi sakda', 'tur nahi reha'
  ],
  salivation: [
    'salivation', 'drooling', 'foaming', 'froth', 'excessive saliva', 'mouth drool',
    'laar', 'thook', 'muh se jhaag', 'laar tapak rahi', 'jhag nikal raha', 'laar tapakna',
    'ral', 'ral vag rahi', 'muh cho jhag', 'thuk'
  ],
  loss_of_appetite: [
    'loss of appetite', 'not eating', 'refusing feed', 'off feed', 'eating less',
    'bhookh nahi', 'chara nahi kha raha', 'khana band', 'ghaas nahi', 'daana nahi kha raha',
    'bhukh nahi', 'chara nahi chuk reha', 'khaan peen band', 'patte nahi kha reha'
  ],
  diarrhea: [
    'diarrhea', 'loose motion', 'watery stool', 'scouring', 'dysentery',
    'dast', 'pet kharab', 'patla gobar', 'dast lag gaye', 'loose potty',
    'mok', 'patla gohar', 'dast lage ne'
  ],
  skin_lesions: [
    'skin lesions', 'blisters', 'bumps', 'nodules', 'sores', 'ulcers', 'lumpy skin',
    'daane', 'chhale', 'phaphole', 'chamdi kharab', 'zakhm', 'fode',
    'folhe', 'gath', 'chhale bane ne'
  ],
  nasal_discharge: [
    'nasal discharge', 'runny nose', 'mucus from nose', 'snot',
    'naak se paani', 'naak beh rahi', 'naak mein resha',
    'nakk cho paani', 'nakk vag reha', 'resha'
  ],
  lameness: [
    'lame', 'lameness', 'limping', 'hoof sore', 'foot rot',
    'langda', 'langdapan', 'khur mein dard', 'khur kharab', 'langda raha hai',
    'lang mar reha', 'khur dukh reha', 'pair te bojh nahi'
  ],
  swelling: [
    'swelling', 'swollen', 'edema', 'lump', 'enlarged',
    'soojan', 'sujan', 'phoola hua', 'gale mein soojan',
    'sooj', 'gale di sooj', 'phulliya'
  ]
};

// Initial Seed Users
const INITIAL_USERS = {
  'farmer@demo.com': { id: 1, name: 'Gurdeep Singh', email: 'farmer@demo.com', role: 'farmer', village: 'Samrala', district: 'Ludhiana', phone: '+91 98765 43210' },
  'vet@demo.com': { id: 2, name: 'Dr. Amritpal Singh (Senior Veterinary Officer)', email: 'vet@demo.com', role: 'vet', village: 'Civil Lines', district: 'Ludhiana', phone: '+91 98123 45678' },
  'govt@demo.com': { id: 3, name: 'Dr. Ravneet Kaur (State Surveillance Director)', email: 'govt@demo.com', role: 'authority', district: 'Ludhiana', state: 'Punjab', phone: '+91 98456 78901' }
};

// Initial Seed Animals (Clean Integer Ages)
const INITIAL_ANIMALS = [
  { id: 1, user_id: 1, name_or_tag: '0036', species: 'cow', age: 3, sex: 'female', breed: 'Sahiwal Indigenous', vaccination_status: 'Vaccinated' },
  { id: 2, user_id: 1, name_or_tag: 'B-204', species: 'buffalo', age: 5, sex: 'female', breed: 'Murrah', vaccination_status: 'Vaccinated' },
  { id: 3, user_id: 1, name_or_tag: 'G-102', species: 'goat', age: 2, sex: 'male', breed: 'Beetal', vaccination_status: 'Vaccinated' },
  { id: 4, user_id: 1, name_or_tag: 'C-412', species: 'cow', age: 4, sex: 'female', breed: 'Holstein Friesian Cross', vaccination_status: 'Partially Vaccinated' }
];

// Initial 39 Reports (Cluster has 28 reports with 7 High Risk, Case #0036 is primary)
function generateInitialReports() {
  const reports = [];
  const clusterCenterLat = 30.9010;
  const clusterCenterLng = 75.8572;

  // Primary Case: "COW – Case #0036"
  reports.push({
    id: 1,
    report_number: 'Case #0036',
    user_id: 1,
    animal_id: 1,
    species: 'cow',
    age: 3,
    animal_tag: '0036',
    animal_breed: 'Sahiwal Indigenous',
    symptoms: ['fever', 'difficulty_walking', 'salivation'],
    duration_days: 2,
    vaccination_status: 'Vaccinated',
    risk_level: 'High',
    status: 'Visit Scheduled',
    is_escalated: false,
    village: 'Samrala',
    district: 'Ludhiana',
    latitude: 30.9012,
    longitude: 75.8575,
    owner_name: 'Gurdeep Singh',
    owner_phone: '+91 98765 43210',
    weather_temp: 33,
    weather_humidity: 62,
    weather_description: 'clear sky',
    weather_wind_speed: 12,
    ai_confidence: 0.94,
    ai_reason: 'Presentation of acute pyrexia (fever) combined with excessive salivation and locomotor distress in cattle indicates high probability of vesicular disease / FMD episode within an active surveillance cluster.',
    contributing_factors: [
      'Acute pyrexia accompanied by oral salivation or lameness (vesicular/FMD profile)',
      'Multiple concurrent symptoms reported (3 active clinical signs)',
      'High spatial density: 7 active cases reported in immediate 5km vicinity'
    ],
    is_verified: true,
    verified_by: 2,
    created_at: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString()
  });

  // 6 additional HIGH-RISK cases in cluster (Total High in cluster = 7)
  const highRiskTemplates = [
    { num: 'Case #0012', species: 'buffalo', age: 6, sym: ['fever', 'salivation', 'swelling'], days: 3, vacc: 'Unvaccinated', notes: 'Submandibular swelling and severe salivation.' },
    { num: 'Case #0019', species: 'cow', age: 4, sym: ['fever', 'difficulty_walking', 'skin_lesions'], days: 2, vacc: 'Partially Vaccinated', notes: 'Vesicular lesions observed on interdigital pouch and dental pad.' },
    { num: 'Case #0023', species: 'cow', age: 4, sym: ['fever', 'coughing', 'nasal_discharge'], days: 4, vacc: 'Unvaccinated', notes: 'Rapid laboured breathing with mucoid nasal discharge.' },
    { num: 'Case #0029', species: 'buffalo', age: 6, sym: ['fever', 'salivation', 'lameness'], days: 2, vacc: 'Vaccinated', notes: 'Refusing feed, excessive drooling, hind limb stiffness.' },
    { num: 'Case #0031', species: 'goat', age: 2, sym: ['fever', 'diarrhea', 'nasal_discharge'], days: 3, vacc: 'Unvaccinated', notes: 'Suspected PPR syndrome; high mortality in local goat pen.' },
    { num: 'Case #0034', species: 'cow', age: 3, sym: ['fever', 'difficulty_walking', 'salivation'], days: 1, vacc: 'Partially Vaccinated', notes: 'Acute shivering, foam at mouth, unable to walk to shed.' },
  ];

  highRiskTemplates.forEach((t, i) => {
    const lat = clusterCenterLat + (Math.sin(i * 1.1) * 0.022);
    const lng = clusterCenterLng + (Math.cos(i * 1.1) * 0.022);
    reports.push({
      id: i + 2,
      report_number: t.num,
      user_id: 1,
      species: t.species,
      age: t.age,
      animal_tag: `TAG-${100 + i}`,
      symptoms: t.sym,
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
      contributing_factors: ['Active cluster proximity', 'Critical symptom combination'],
      is_verified: i < 3,
      status: i === 0 ? 'In Treatment' : (i === 1 ? 'Visit Scheduled' : 'Under Review'),
      is_escalated: i === 2,
      weather_temp: 33.0,
      weather_humidity: 60.0,
      weather_description: 'clear sky',
      weather_wind_speed: 11.0,
      owner_name: i % 2 === 0 ? 'Gurdeep Singh' : 'Harbhajan Ram',
      owner_phone: '+91 98765 43210',
      created_at: new Date(Date.now() - (i + 1) * 86400 * 1000 * 0.8).toISOString(),
      updated_at: new Date(Date.now() - (i + 1) * 86400 * 1000 * 0.8).toISOString()
    });
  });

  // 21 MEDIUM and LOW risk cases in the cluster (Total in cluster = 28)
  for (let i = 1; i <= 21; i++) {
    const isMedium = i <= 14;
    const caseNum = `Case #${String(40 + i).padStart(4, '0')}`;
    const angle = (i / 21) * 2 * Math.PI;
    const dist = 0.015 + (i % 5) * 0.005;
    const lat = clusterCenterLat + Math.sin(angle) * dist;
    const lng = clusterCenterLng + Math.cos(angle) * dist;
    const species = ['cow', 'buffalo', 'goat', 'sheep'][i % 4];

    const sym = isMedium
      ? (i % 2 === 0 ? ['loss_of_appetite', 'diarrhea'] : ['coughing', 'loss_of_appetite'])
      : (i % 2 === 0 ? ['loss_of_appetite'] : ['lameness']);

    reports.push({
      id: 7 + i,
      report_number: caseNum,
      user_id: 1,
      species,
      age: 2 + (i % 6),
      animal_tag: `TAG-${200 + i}`,
      symptoms: sym,
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
      contributing_factors: isMedium ? ['Moderate appetite depression'] : ['Isolated symptom'],
      is_verified: i % 4 === 0,
      status: i % 5 === 0 ? 'Resolved' : (isMedium ? 'New' : 'Under Review'),
      is_escalated: false,
      weather_temp: 32.5,
      weather_humidity: 61.0,
      weather_description: 'clear sky',
      weather_wind_speed: 12.0,
      owner_name: 'Gurdeep Singh',
      owner_phone: '+91 98765 43210',
      created_at: new Date(Date.now() - (i % 7 + 1) * 86400 * 1000 * 0.9).toISOString(),
      updated_at: new Date(Date.now() - (i % 7 + 1) * 86400 * 1000 * 0.9).toISOString()
    });
  }

  // 11 Scattered Cases across Punjab (Total reports = 39)
  const scattered = [
    { num: 'Case #0002', loc: [30.7046, 76.7179], vill: 'Mohali', sp: 'cow', risk: 'Medium', sym: ['coughing'], stat: 'Resolved' },
    { num: 'Case #0005', loc: [30.3400, 76.3800], vill: 'Patiala Rural', sp: 'buffalo', risk: 'High', sym: ['fever', 'swelling', 'difficulty_walking'], stat: 'In Treatment' },
    { num: 'Case #0008', loc: [31.3260, 75.5762], vill: 'Jalandhar Cantt', sp: 'cow', risk: 'Low', sym: ['lameness'], stat: 'Resolved' },
    { num: 'Case #0015', loc: [30.7600, 75.5200], vill: 'Jagraon', sp: 'goat', risk: 'High', sym: ['fever', 'diarrhea', 'nasal_discharge'], stat: 'Visit Scheduled' },
    { num: 'Case #0018', loc: [30.6500, 75.8000], vill: 'Raikot', sp: 'cow', risk: 'Medium', sym: ['loss_of_appetite', 'coughing'], stat: 'New' },
    { num: 'Case #0022', loc: [30.7100, 76.2200], vill: 'Fatehgarh Sahib', sp: 'buffalo', risk: 'High', sym: ['fever', 'salivation'], stat: 'Under Review' },
    { num: 'Case #0025', loc: [31.0200, 75.8000], vill: 'Phillaur', sp: 'cow', risk: 'Low', sym: ['loss_of_appetite'], stat: 'Resolved' },
    { num: 'Case #0027', loc: [30.4000, 76.2000], vill: 'Nabha', sp: 'sheep', risk: 'Medium', sym: ['coughing'], stat: 'Under Review' },
    { num: 'Case #0033', loc: [30.8500, 75.6000], vill: 'Mullanpur', sp: 'buffalo', risk: 'Low', sym: ['lameness'], stat: 'Resolved' },
    { num: 'Case #0037', loc: [30.9800, 76.0500], vill: 'Machhiwara', sp: 'cow', risk: 'Medium', sym: ['loss_of_appetite', 'diarrhea'], stat: 'New' },
    { num: 'Case #0039', loc: [30.5500, 76.1000], vill: 'Amloh', sp: 'goat', risk: 'Medium', sym: ['coughing', 'nasal_discharge'], stat: 'Visit Scheduled' }
  ];

  scattered.forEach((s, i) => {
    reports.push({
      id: 29 + i,
      report_number: s.num,
      user_id: 1,
      species: s.sp,
      age: 3,
      animal_tag: `TAG-${300 + i}`,
      symptoms: s.sym,
      duration_days: 2,
      vaccination_status: 'Vaccinated',
      free_text_notes: `Field report registered from ${s.vill}.`,
      latitude: s.loc[0],
      longitude: s.loc[1],
      village: s.vill,
      district: s.vill.includes('Patiala') ? 'Patiala' : (s.vill.includes('Jalandhar') ? 'Jalandhar' : 'Ludhiana'),
      risk_level: s.risk,
      ai_confidence: 0.88,
      ai_reason: `${s.risk} risk profile based on clinical indicators: ${s.sym.join(', ')}.`,
      contributing_factors: [`Regional surveillance indicator (${s.vill})`],
      is_verified: s.stat === 'Resolved' || s.stat === 'In Treatment',
      status: s.stat,
      is_escalated: false,
      weather_temp: 33.0,
      weather_humidity: 62.0,
      weather_description: 'clear sky',
      weather_wind_speed: 12.0,
      owner_name: 'Gurdeep Singh',
      owner_phone: '+91 98765 43210',
      created_at: new Date(Date.now() - (i + 2) * 86400 * 1000 * 0.7).toISOString(),
      updated_at: new Date(Date.now() - (i + 2) * 86400 * 1000 * 0.7).toISOString()
    });
  });

  return reports;
}

// Initial Notifications
const INITIAL_NOTIFICATIONS = [
  { id: 1, report_id: 1, title: '🚨 High-Risk Case Alert: COW (Case #0036)', message: 'High-risk case reported at Samrala requiring priority veterinary action.', is_read: false, created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString() },
  { id: 2, report_id: 1, title: '⚡ Possible Outbreak Hotspot Warning', message: 'Surveillance alert: 28 reports (7 high-risk) detected within 5 km radius in Samrala / Ludhiana East.', is_read: false, created_at: new Date(Date.now() - 3600 * 1000 * 8).toISOString() }
];

// Load or Initialize Cloud State
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[PashuRakshak Mock Engine] State load error:', e);
  }

  const initial = {
    users: INITIAL_USERS,
    animals: INITIAL_ANIMALS,
    reports: generateInitialReports(),
    mortality: [],
    visits: [
      { id: 1, report_id: 1, scheduled_date: 'Tomorrow', scheduled_time: '10:30 AM', status: 'scheduled', notes: 'Urgent mobile clinic dispatched for vesicular assessment.' }
    ],
    treatments: [],
    notifications: INITIAL_NOTIFICATIONS
  };

  saveState(initial);
  return initial;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[PashuRakshak Mock Engine] State save error:', e);
  }
}

// Clinical AI Risk Assessment Engine
export function evaluateRisk(reportData) {
  const symptoms = reportData.symptoms || [];
  let score = 0;
  const factors = [];

  const fever = symptoms.includes('fever');
  const coughing = symptoms.includes('coughing');
  const diffWalking = symptoms.includes('difficulty_walking');
  const salivation = symptoms.includes('salivation');
  const lossAppetite = symptoms.includes('loss_of_appetite');
  const diarrhea = symptoms.includes('diarrhea');
  const skinLesions = symptoms.includes('skin_lesions');
  const nasalDischarge = symptoms.includes('nasal_discharge');
  const lameness = symptoms.includes('lameness');
  const swelling = symptoms.includes('swelling');

  if (fever && (salivation || diffWalking || lameness || skinLesions)) {
    score += 45;
    factors.push('Acute pyrexia accompanied by oral salivation or lameness (vesicular/FMD profile)');
  }
  if (coughing && (nasalDischarge || fever)) {
    score += 35;
    factors.push('Respiratory distress with nasal discharge and elevated temperature');
  }
  if (diarrhea && (lossAppetite || fever)) {
    score += 25;
    factors.push('Severe enteric symptoms (diarrhea with systemic anorexia/pyrexia)');
  }
  if (skinLesions && (swelling || fever)) {
    score += 30;
    factors.push('Cutaneous nodules/lesions with localized swelling');
  }
  if (symptoms.length >= 3) {
    score += 20;
    factors.push(`Multiple concurrent symptoms reported (${symptoms.length} active clinical signs)`);
  }
  if (reportData.vaccination_status === 'Unvaccinated') {
    score += 15;
    factors.push('Animal is unvaccinated against core livestock pathogens');
  } else if (reportData.vaccination_status === 'Partially Vaccinated') {
    score += 8;
    factors.push('Partial vaccination history indicates incomplete immunization');
  }

  // Hotspot proximity bonus
  score += 25;
  factors.push('High spatial density: active surveillance cluster detected in immediate 5km radius');

  let riskLevel = 'Low';
  let reason = 'Mild or isolated symptoms observed. Normal monitoring recommended.';
  let confidence = 0.85;

  if (score >= 55) {
    riskLevel = 'High';
    confidence = 0.94;
    reason = `Urgent veterinary attention is recommended for this case. High-risk indicators: ${symptoms.slice(0, 3).join(', ')} detected within surveillance perimeter.`;
  } else if (score >= 28) {
    riskLevel = 'Medium';
    confidence = 0.88;
    reason = `Moderate risk identified with ${symptoms.length} clinical signs. Secondary observation and follow-up scheduled.`;
  }

  return {
    riskLevel,
    risk_level: riskLevel,
    confidence,
    reason,
    contributingFactors: factors,
    contributing_factors: factors
  };
}

// Voice Transcript Parsing
export function parseVoiceTranscript(transcript = '') {
  if (!transcript || typeof transcript !== 'string') {
    return { detectedSymptoms: [], transcript: '', matchedCount: 0 };
  }
  const clean = transcript.toLowerCase();
  const detected = [];
  for (const [symptomKey, keywords] of Object.entries(VOICE_SYMPTOM_DICTIONARY)) {
    if (keywords.some(kw => clean.includes(kw.toLowerCase()))) {
      if (!detected.includes(symptomKey)) detected.push(symptomKey);
    }
  }
  return {
    detectedSymptoms: detected,
    transcript,
    matchedCount: detected.length,
    suggestedNotes: transcript
  };
}

// Main Cloud Mock Dispatcher
export async function handleMockRequest(config) {
  const state = loadState();
  const url = (config.url || '').replace(/^\/api/, '');
  const method = (config.method || 'get').toLowerCase();
  const data = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});

  // 1. Auth: Login
  if (url.includes('/auth/login') && method === 'post') {
    const email = data.email || 'farmer@demo.com';
    let user = state.users[email];
    if (!user) {
      // Create user if logging in with new credentials in demo
      const role = email.includes('vet') ? 'vet' : (email.includes('govt') || email.includes('auth') ? 'authority' : 'farmer');
      user = {
        id: Object.keys(state.users).length + 1,
        name: email.split('@')[0].toUpperCase(),
        email,
        role,
        village: 'Samrala',
        district: 'Ludhiana',
        phone: '+91 98765 00000'
      };
      state.users[email] = user;
      saveState(state);
    }
    const token = 'pashurakshak_jwt_demo_' + user.role + '_' + Date.now();
    return { data: { user, token } };
  }

  // 2. Auth: Register
  if (url.includes('/auth/register') && method === 'post') {
    const newUser = {
      id: Object.keys(state.users).length + 1,
      name: data.name || 'New Member',
      email: data.email,
      role: data.role || 'farmer',
      village: data.village || 'Samrala',
      district: data.district || 'Ludhiana',
      phone: data.phone || '+91 98765 43210'
    };
    state.users[data.email] = newUser;
    saveState(state);
    const token = 'pashurakshak_jwt_demo_' + newUser.role + '_' + Date.now();
    return { data: { user: newUser, token } };
  }

  // 3. Auth: Me
  if (url.includes('/auth/me') && method === 'get') {
    const saved = localStorage.getItem('pashurakshak_user') || localStorage.getItem('pashumitra_user');
    const user = saved ? JSON.parse(saved) : state.users['farmer@demo.com'];
    return { data: { user } };
  }

  // 4. Animals: GET single by ID
  if (url.match(/\/animals\/(\d+)/) && method === 'get') {
    const match = url.match(/\/animals\/(\d+)/);
    const animalId = parseInt(match[1]);
    const animal = state.animals.find(a => a.id === animalId) || state.animals[0];
    const matchingReports = state.reports.filter(r =>
      r.animal_id === animal.id ||
      r.animal_tag === animal.name_or_tag ||
      (r.species === animal.species && animal.id === 1)
    );
    return { data: { animal, reports: matchingReports } };
  }

  // 4b. Animals: GET all
  if (url.includes('/animals') && method === 'get') {
    return { data: { animals: state.animals } };
  }

  // 5. Animals: POST
  if (url.includes('/animals') && method === 'post') {
    const newAnimal = {
      id: state.animals.length + 1,
      user_id: 1,
      name_or_tag: data.name_or_tag || `TAG-${Date.now() % 1000}`,
      species: data.species || 'cow',
      age: parseInt(data.age) || 3,
      sex: data.sex || 'female',
      breed: data.breed || 'Indigenous',
      vaccination_status: data.vaccination_status || 'Vaccinated'
    };
    state.animals.push(newAnimal);
    saveState(state);
    return { data: { animal: newAnimal } };
  }

  // 6. Reports: GET by ID (flexible matching)
  if (url.match(/\/reports\/([^\/?]+)/) && method === 'get' && !url.includes('/status')) {
    const match = url.match(/\/reports\/([^\/?]+)/);
    const idParam = decodeURIComponent(match[1]);
    const parsedNum = parseInt(idParam);
    const report = state.reports.find(r =>
      r.id === parsedNum ||
      r.report_number === idParam ||
      r.report_number.toLowerCase() === idParam.toLowerCase() ||
      r.report_number.endsWith(String(parsedNum).padStart(4, '0'))
    ) || state.reports[0];
    const visits = state.visits.filter(v => v.report_id === report.id);
    const treatments = state.treatments.filter(t => t.report_id === report.id);
    return { data: { report, visits, treatments } };
  }

  // 7. Reports: PATCH Status
  if (url.match(/\/reports\/(\d+)\/status/) && method === 'patch') {
    const match = url.match(/\/reports\/(\d+)\/status/);
    const reportId = parseInt(match[1]);
    const report = state.reports.find(r => r.id === reportId);
    if (report) {
      report.status = data.status || report.status;
      report.updated_at = new Date().toISOString();
      saveState(state);
      return { data: { report } };
    }
  }

  // 8. Reports: POST Treatment
  if (url.match(/\/reports\/(\d+)\/treatment/) && method === 'post') {
    const match = url.match(/\/reports\/(\d+)\/treatment/);
    const reportId = parseInt(match[1]);
    const treatment = {
      id: state.treatments.length + 1,
      report_id: reportId,
      diagnosis: data.diagnosis || 'Clinical examination complete',
      medications: data.medications || 'Supportive fluid therapy & antipyretic',
      notes: data.notes || '',
      created_at: new Date().toISOString()
    };
    state.treatments.push(treatment);
    const report = state.reports.find(r => r.id === reportId);
    if (report) {
      report.status = 'In Treatment';
    }
    saveState(state);
    return { data: { treatment } };
  }

  // 9. Reports: POST Visit
  if (url.match(/\/reports\/(\d+)\/visit/) && method === 'post') {
    const match = url.match(/\/reports\/(\d+)\/visit/);
    const reportId = parseInt(match[1]);
    const visit = {
      id: state.visits.length + 1,
      report_id: reportId,
      scheduled_date: data.scheduled_date || 'Scheduled Date',
      scheduled_time: data.scheduled_time || 'Morning',
      notes: data.notes || 'Veterinary officer visit scheduled',
      status: 'scheduled',
      created_at: new Date().toISOString()
    };
    state.visits.push(visit);
    const report = state.reports.find(r => r.id === reportId);
    if (report) {
      report.status = 'Visit Scheduled';
    }
    saveState(state);
    return { data: { visit } };
  }

  // 10. Reports: POST Escalate
  if (url.match(/\/reports\/(\d+)\/escalate/) && method === 'post') {
    const match = url.match(/\/reports\/(\d+)\/escalate/);
    const reportId = parseInt(match[1]);
    const report = state.reports.find(r => r.id === reportId);
    if (report) {
      report.is_escalated = true;
      saveState(state);
      return { data: { report } };
    }
  }

  // 11. Reports: GET List (with query filtering for status, species, risk, days)
  if (url.includes('/reports') && method === 'get') {
    let reports = [...state.reports];
    if (url.includes('days=')) {
      const daysCount = parseInt(url.split('days=')[1].split('&')[0]) || 3;
      const cutoff = new Date(Date.now() - daysCount * 24 * 60 * 60 * 1000);
      reports = reports.filter(r => new Date(r.created_at) >= cutoff);
    }
    if (url.includes('status=')) {
      const statusParam = decodeURIComponent(url.split('status=')[1].split('&')[0]);
      reports = reports.filter(r => r.status.toLowerCase() === statusParam.toLowerCase());
    }
    if (url.includes('risk_level=')) {
      const riskParam = decodeURIComponent(url.split('risk_level=')[1].split('&')[0]);
      reports = reports.filter(r => r.risk_level.toLowerCase() === riskParam.toLowerCase());
    }
    if (url.includes('species=')) {
      const specParam = decodeURIComponent(url.split('species=')[1].split('&')[0]);
      reports = reports.filter(r => r.species.toLowerCase() === specParam.toLowerCase());
    }
    return { data: { reports } };
  }

  // 12. Reports: POST Create
  if (url.includes('/reports') && method === 'post') {
    const riskAssessment = evaluateRisk(data);
    const nextNum = state.reports.length + 1;
    const reportNum = `Case #${String(nextNum).padStart(4, '0')}`;

    const newReport = {
      id: state.reports.length + 1,
      report_number: reportNum,
      user_id: 1,
      species: data.species || 'cow',
      age: parseInt(data.age) || 3,
      animal_tag: data.animal_tag || `TAG-${Date.now() % 1000}`,
      symptoms: data.symptoms || [],
      duration_days: parseInt(data.duration_days) || 1,
      vaccination_status: data.vaccination_status || 'Vaccinated',
      free_text_notes: data.free_text_notes || '',
      latitude: data.latitude || 30.9012,
      longitude: data.longitude || 75.8575,
      village: data.village || 'Samrala',
      district: data.district || 'Ludhiana',
      risk_level: riskAssessment.riskLevel,
      ai_confidence: riskAssessment.confidence,
      ai_reason: riskAssessment.reason,
      contributing_factors: riskAssessment.contributingFactors,
      status: 'New',
      is_escalated: false,
      owner_name: 'Gurdeep Singh',
      owner_phone: '+91 98765 43210',
      weather_temp: 33,
      weather_humidity: 62,
      weather_description: 'clear sky',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    state.reports.unshift(newReport);

    // If high risk, generate notification
    if (riskAssessment.riskLevel === 'High') {
      state.notifications.unshift({
        id: state.notifications.length + 1,
        title: `🚨 High-Risk Case Alert: ${(data.species || 'Livestock').toUpperCase()} (${reportNum})`,
        message: `High-risk case reported at ${data.village || 'Samrala'} with critical symptoms: ${(data.symptoms || []).join(', ')}.`,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    saveState(state);
    return {
      data: {
        report: newReport,
        aiAssessment: riskAssessment,
        risk_assessment: riskAssessment
      }
    };
  }

  // 13. Mortality: POST
  if (url.includes('/mortality') && method === 'post') {
    const mortalityRecord = {
      id: state.mortality.length + 1,
      species: data.species || 'cow',
      mortality_count: parseInt(data.mortality_count) || 1,
      suspected_cause: data.suspected_cause || 'Acute illness',
      village: data.village || 'Samrala',
      district: data.district || 'Ludhiana',
      created_at: new Date().toISOString()
    };
    state.mortality.push(mortalityRecord);
    saveState(state);
    return { data: { report: mortalityRecord } };
  }

  // 14. Hotspots: GET
  if (url.includes('/hotspots') && method === 'get') {
    const highRiskCount = state.reports.filter(r => r.risk_level === 'High').length;
    return {
      data: {
        hotspots: [
          {
            id: 1,
            name: 'Possible Outbreak Hotspot',
            center_lat: 30.9010,
            center_lng: 75.8572,
            radius_km: 5.0,
            total_reports: 28,
            high_risk_reports: 7,
            dominant_symptoms: ['fever', 'salivation', 'difficulty_walking'],
            status: 'active'
          }
        ]
      }
    };
  }

  // 15. Weather: GET
  if (url.includes('/weather') && method === 'get') {
    return {
      data: {
        weather: {
          temp: 33,
          humidity: 62,
          wind_speed: 12,
          description: 'clear sky',
          environmental_notice: 'Weather is shown as environmental context, not a disease diagnosis.'
        }
      }
    };
  }

  // 16. Analytics: Summary
  if (url.includes('/analytics/summary') && method === 'get') {
    const totalReports = state.reports.length;
    const highRiskCount = state.reports.filter(r => r.risk_level === 'High').length;
    const visitsScheduled = state.visits.length + state.reports.filter(r => r.status === 'Visit Scheduled').length;
    const resolvedCases = state.reports.filter(r => r.status === 'Resolved').length;

    return {
      data: {
        summary: {
          totalReports,
          highRiskCount,
          activeHotspots: 1,
          visitsScheduled,
          resolvedCases,
          totalMortality: 3 + state.mortality.length
        }
      }
    };
  }

  // 17. Analytics: Districts
  if (url.includes('/analytics/districts') && method === 'get') {
    return {
      data: {
        districts: [
          { district: 'Ludhiana', totalReports: 28, highRiskCount: 7, hotspotStatus: 'Active Hotspot (5 km)', primarySymptoms: 'Fever, Salivation, Lameness', alertLevel: 'Red', actionRequired: 'Ring vaccination & Vet dispatch' },
          { district: 'Patiala', totalReports: 4, highRiskCount: 1, hotspotStatus: 'Under Observation', primarySymptoms: 'Swelling, Recumbency', alertLevel: 'Amber', actionRequired: 'Sample collection underway' },
          { district: 'Jalandhar', totalReports: 3, highRiskCount: 1, hotspotStatus: 'Stable', primarySymptoms: 'Mild Lameness, Diarrhea', alertLevel: 'Green', actionRequired: 'Routine monitoring' },
          { district: 'Fatehgarh Sahib', totalReports: 2, highRiskCount: 1, hotspotStatus: 'Monitoring Proximity', primarySymptoms: 'Fever, Salivation', alertLevel: 'Amber', actionRequired: 'Buffer zone containment' },
          { district: 'SAS Nagar (Mohali)', totalReports: 2, highRiskCount: 0, hotspotStatus: 'Normal Baseline', primarySymptoms: 'Minor Coughing', alertLevel: 'Green', actionRequired: 'Standard biosecurity' }
        ]
      }
    };
  }

  // 18. Analytics: Mortality Stats
  if (url.includes('/analytics/mortality-stats') && method === 'get') {
    return {
      data: {
        officialMortalityData: {
          title: 'Reported Animal Deaths from Selected Livestock Diseases, January – June 2024',
          timeframe: 'January – June 2024',
          highlightCallout: '51,848 Reported deaths from Ranikhet disease + IBD',
          source: 'Government of India, Department of Animal Husbandry & Dairying, Basic Animal Husbandry Statistics 2025',
          diseases: [
            { disease: 'Ranikhet Disease', deaths: 27420, species: 'Poultry', color: '#1F3A8A' },
            { disease: 'Infectious Bursal Disease (IBD)', deaths: 24428, species: 'Poultry', color: '#3B5BA5' },
            { disease: 'Peste des Petits Ruminants (PPR)', deaths: 3510, species: 'Goat / Sheep', color: '#D97706' },
            { disease: 'African Swine Fever', deaths: 2840, species: 'Pig', color: '#DC2626' },
            { disease: 'Fowl Pox', deaths: 1230, species: 'Poultry', color: '#7CB342' }
          ]
        }
      }
    };
  }

  // 19. Analytics: Trends
  if (url.includes('/analytics/trends') && method === 'get') {
    return {
      data: {
        trends: [
          { date: '2026-10-02', day: 'Wed', highRisk: 2, mediumRisk: 5, lowRisk: 3 },
          { date: '2026-10-03', day: 'Thu', highRisk: 3, mediumRisk: 6, lowRisk: 4 },
          { date: '2026-10-04', day: 'Fri', highRisk: 4, mediumRisk: 7, lowRisk: 4 },
          { date: '2026-10-05', day: 'Sat', highRisk: 2, mediumRisk: 6, lowRisk: 5 },
          { date: '2026-10-06', day: 'Sun', highRisk: 5, mediumRisk: 8, lowRisk: 4 },
          { date: '2026-10-07', day: 'Mon', highRisk: 3, mediumRisk: 6, lowRisk: 5 },
          { date: '2026-10-08', day: 'Tue', highRisk: 4, mediumRisk: 7, lowRisk: 4 }
        ]
      }
    };
  }

  // 20. Notifications: GET
  if (url.includes('/notifications') && method === 'get') {
    const unreadCount = state.notifications.filter(n => !n.is_read).length;
    return { data: { notifications: state.notifications, unreadCount } };
  }

  // 21. Notifications: Read All
  if (url.includes('/notifications/read-all') && method === 'post') {
    state.notifications.forEach(n => { n.is_read = true; });
    saveState(state);
    return { data: { success: true } };
  }

  // 22. Notifications: Single Read
  if (url.match(/\/notifications\/(\d+)\/read/) && method === 'patch') {
    const match = url.match(/\/notifications\/(\d+)\/read/);
    const nId = parseInt(match[1]);
    const notif = state.notifications.find(n => n.id === nId);
    if (notif) notif.is_read = true;
    saveState(state);
    return { data: { success: true } };
  }

  // 23. Voice: Parse
  if (url.includes('/voice/parse') && method === 'post') {
    const parsed = parseVoiceTranscript(data.transcript || '');
    return { data: parsed };
  }

  // 24. Vets: Nearby Directory & Tele-Consultation
  if (url.includes('/vets')) {
    return { data: { vets: NEARBY_VETS } };
  }

  // 25. Ambulance: 1962 Mobile Veterinary Unit Dispatch & Tracking
  if (url.includes('/ambulance')) {
    return {
      data: {
        success: true,
        unit: MOBILE_VET_UNITS[0],
        message: '1962 Mobile Veterinary Unit dispatched successfully!'
      }
    };
  }

  // Fallback default response
  return { data: { success: true, message: 'Processed by PashuRakshak engine' } };
}
