require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const migrate = require('./db/migrate');
const seed = require('./db/seed');
const { trainModel } = require('./ai/riskModel');

const authRoutes = require('./routes/auth');
const animalRoutes = require('./routes/animals');
const reportRoutes = require('./routes/reports');
const hotspotRoutes = require('./routes/hotspots');
const notificationRoutes = require('./routes/notifications');
const weatherRoutes = require('./routes/weather');
const analyticsRoutes = require('./routes/analytics');
const voiceRoutes = require('./routes/voice');
const vetsRoutes = require('./routes/vets');
const ambulanceRoutes = require('./routes/ambulance');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/hotspots', hotspotRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/vets', vetsRoutes);
app.use('/api/ambulance', ambulanceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'PashuRakshak Early-Warning & Disease Surveillance',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  try {
    console.log('--------------------------------------------------');
    console.log('🌿 PashuRakshak Server Initializing...');
    console.log('--------------------------------------------------');

    // 1. Run DB migrations
    await migrate();

    // 2. Run Seed data
    await seed();

    // 3. Train AI Random Forest Model
    await trainModel();

    // 4. Start HTTP Server
    app.listen(PORT, () => {
      console.log('==================================================');
      console.log(`🚀 PashuRakshak Backend running on: http://localhost:${PORT}`);
      console.log(`📊 AI Risk Model: Online (Random Forest + Clinical Fallback)`);
      console.log(`📍 Spatial Hotspot Engine: Online (DBSCAN 5km Radius)`);
      console.log(`🌦️ Weather Integration: Online (OpenWeatherMap + Simulation)`);
      console.log('==================================================');
    });
  } catch (err) {
    console.error('Fatal error during server startup:', err);
    process.exit(1);
  }
}

startServer();
