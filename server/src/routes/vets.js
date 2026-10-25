const express = require('express');
const router = express.Router();

const NEARBY_VETS = [
  {
    id: 1,
    name: 'Dr. Harpreet Singh',
    title: 'Senior Veterinary Surgeon (MVSc Surgery)',
    clinic: 'Civil Veterinary Hospital, Samrala',
    distanceKm: 1.8,
    rating: 4.9,
    reviewsCount: 342,
    experienceYears: 14,
    phone: '+91 98765-21011',
    isOnline: true,
    isGovt: true,
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
    specialties: ['Cattle & Buffaloes', 'Acute FMD/Infections', 'Emergency Surgery'],
    charges: { voiceCall: 0, videoCall: 0, farmVisit: 150 },
    feeNote: 'Free Govt. Tele-Consultation (Govt of Punjab / DAHD)',
    languages: ['Punjabi', 'Hindi', 'English'],
    statusText: 'Available Now'
  },
  {
    id: 2,
    name: 'Dr. Neha Sharma',
    title: 'Livestock & Ruminant Specialist (BVSc & AH)',
    clinic: 'Kisan Pashu Seva Kendra, Samrala Bypass',
    distanceKm: 2.7,
    rating: 4.8,
    reviewsCount: 218,
    experienceYears: 9,
    phone: '+91 98140-77821',
    isOnline: true,
    isGovt: false,
    avatar: 'https://images.unsplash.com/photo-1594824813589-a901844b6483?w=300&auto=format&fit=crop&q=80',
    specialties: ['Dairy Cattle', 'Mastitis Management', 'Vaccination Protocols'],
    charges: { voiceCall: 79, videoCall: 149, farmVisit: 300 },
    feeNote: 'Private Clinic • Instant Video Inspection',
    languages: ['Hindi', 'Punjabi'],
    statusText: 'Available Now'
  },
  {
    id: 3,
    name: 'Dr. Gurinder Singh Gill',
    title: 'District Epidemiological Officer (MVSc)',
    clinic: 'Sub-Divisional Veterinary Polyclinic, Ludhiana East',
    distanceKm: 4.1,
    rating: 4.95,
    reviewsCount: 489,
    experienceYears: 18,
    phone: '+91 98722-19620',
    isOnline: true,
    isGovt: true,
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
    specialties: ['Outbreak Containment', 'Herd Health', 'Zoonotic Prevention'],
    charges: { voiceCall: 0, videoCall: 0, farmVisit: 0 },
    feeNote: 'Emergency 1962 Outbreak Response Officer',
    languages: ['Punjabi', 'Hindi', 'English'],
    statusText: 'On Emergency Duty'
  },
  {
    id: 4,
    name: 'Dr. Rajesh Verma',
    title: 'Livestock Medicine Consultant (PhD)',
    clinic: 'Ludhiana Central Veterinary Hospital',
    distanceKm: 5.6,
    rating: 4.7,
    reviewsCount: 165,
    experienceYears: 11,
    phone: '+91 94178-55412',
    isOnline: true,
    isGovt: false,
    avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&auto=format&fit=crop&q=80',
    specialties: ['Infectious Respiratory Diseases', 'Calf Mortality', 'Nutrition'],
    charges: { voiceCall: 99, videoCall: 199, farmVisit: 350 },
    feeNote: 'Multi-Specialty Private Vet Hospital',
    languages: ['Hindi', 'English'],
    statusText: 'Available Now'
  },
  {
    id: 5,
    name: 'Dr. Simranjeet Kaur',
    title: 'Large Animal Gynecologist & Surgeon (MVSc)',
    clinic: 'Khamanon Animal Wellness Center',
    distanceKm: 6.4,
    rating: 4.85,
    reviewsCount: 290,
    experienceYears: 12,
    phone: '+91 98889-44129',
    isOnline: false,
    isGovt: false,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
    specialties: ['Reproduction & Calving', 'Surgical Procedures', 'Goat/Sheep Health'],
    charges: { voiceCall: 89, videoCall: 169, farmVisit: 320 },
    feeNote: 'Private Clinic • Available by Appointment',
    languages: ['Punjabi', 'Hindi'],
    statusText: 'In Surgery (Next slot in 30 mins)'
  }
];

// GET /api/vets
router.get('/', (req, res) => {
  res.json({
    success: true,
    vets: NEARBY_VETS
  });
});

module.exports = router;
