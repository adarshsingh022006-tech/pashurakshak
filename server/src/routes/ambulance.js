const express = require('express');
const router = express.Router();

const MVU_UNIT = {
  id: 'MVU-1962-SAMRALA',
  vehicleNumber: 'PB-10-MVU-1962',
  unitName: 'Samrala Block 1962 Emergency Unit',
  vehicleType: 'TATA Winger Custom Mobile Veterinary Clinic',
  driverName: 'Balwinder Singh',
  driverPhone: '+91 98765-19621',
  leadVet: 'Dr. Aman Kaur (Field Veterinary Officer)',
  leadVetPhone: '+91 98765-19622',
  currentLocation: {
    lat: 30.9125,
    lng: 75.8710,
    locality: 'Samrala-Chandigarh Highway (Near Toll Plaza)'
  },
  distanceRemainingKm: 3.2,
  etaMinutes: 12,
  speedKmH: 42,
  equipment: [
    'Digital Portable Ultrasound Scanner',
    'Oxygen Cylinder with Animal Mask',
    'IV Fluid Infusion Setup (Dextrose, Normal Saline)',
    'Emergency Antibiotics & Antipyretics Kit',
    'Suture & Wound Dressing Surgical Tray',
    'Liquid Nitrogen Cryocan for Semen/Vaccines',
    'Hydraulic Animal Lifting Stretcher'
  ],
  status: 'EN_ROUTE',
  hotline: '1962'
};

// GET /api/ambulance
router.get('/', (req, res) => {
  res.json({
    success: true,
    unit: MVU_UNIT
  });
});

// POST /api/ambulance/dispatch
router.post('/dispatch', (req, res) => {
  const { village, caseNumber, reason } = req.body;
  res.json({
    success: true,
    message: `1962 Mobile Veterinary Unit PB-10-MVU-1962 dispatched to ${village || 'Samrala'} for Case ${caseNumber || '#0036'}.`,
    unit: MVU_UNIT
  });
});

module.exports = router;
