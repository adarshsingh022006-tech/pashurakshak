const db = require('./index');

async function migrate() {
  console.log('[DB] Checking database tables...');

  // 1. Users Table
  if (!(await db.schema.hasTable('users'))) {
    await db.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email').unique().notNullable();
      table.string('password_hash').notNullable();
      table.string('role').notNullable().defaultTo('farmer'); // 'farmer', 'vet', 'authority'
      table.string('phone').nullable();
      table.string('village').nullable();
      table.string('district').nullable();
      table.string('state').defaultTo('Punjab');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('[DB] Created table: users');
  }

  // 2. Animals Table
  if (!(await db.schema.hasTable('animals'))) {
    await db.schema.createTable('animals', (table) => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('name_or_tag').notNullable();
      table.string('species').notNullable(); // cow, buffalo, goat, sheep, pig, poultry
      table.integer('age').defaultTo(3);
      table.string('sex').defaultTo('female');
      table.string('breed').nullable();
      table.string('vaccination_status').defaultTo('Vaccinated'); // Vaccinated, Unvaccinated, Partially Vaccinated
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('[DB] Created table: animals');
  }

  // 3. Health Reports Table
  if (!(await db.schema.hasTable('health_reports'))) {
    await db.schema.createTable('health_reports', (table) => {
      table.increments('id').primary();
      table.string('report_number').unique().notNullable(); // e.g. "Case #0036"
      table.integer('user_id').references('id').inTable('users').onDelete('SET NULL').nullable();
      table.integer('animal_id').references('id').inTable('animals').onDelete('SET NULL').nullable();
      table.string('species').notNullable();
      table.integer('age').defaultTo(3);
      table.text('symptoms').notNullable(); // JSON array string
      table.integer('duration_days').defaultTo(1);
      table.string('vaccination_status').defaultTo('Vaccinated');
      table.text('free_text_notes').nullable();
      table.string('photo_url').nullable();
      
      // Geo coordinates
      table.float('latitude').notNullable();
      table.float('longitude').notNullable();
      table.string('village').nullable();
      table.string('district').nullable();

      // AI Risk assessment
      table.string('risk_level').notNullable().defaultTo('Low'); // High, Medium, Low
      table.float('ai_confidence').defaultTo(0.85);
      table.text('ai_reason').nullable();
      table.text('contributing_factors').nullable(); // JSON array
      
      // Human-in-the-loop & Lifecycle
      table.boolean('is_verified').defaultTo(false);
      table.integer('verified_by').references('id').inTable('users').nullable();
      table.timestamp('verified_at').nullable();
      table.string('status').defaultTo('New'); // New, Under Review, Visit Scheduled, In Treatment, Resolved
      table.boolean('is_escalated').defaultTo(false);

      // Environmental context snapshot
      table.float('weather_temp').nullable();
      table.float('weather_humidity').nullable();
      table.string('weather_description').nullable();
      table.float('weather_wind_speed').nullable();

      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());

      // Indexes
      table.index(['latitude', 'longitude']);
      table.index('risk_level');
      table.index('status');
      table.index('created_at');
    });
    console.log('[DB] Created table: health_reports');
  }

  // 4. Mortality Reports Table
  if (!(await db.schema.hasTable('mortality_reports'))) {
    await db.schema.createTable('mortality_reports', (table) => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('SET NULL').nullable();
      table.string('species').notNullable();
      table.integer('count').notNullable().defaultTo(1);
      table.string('suspected_cause').nullable();
      table.text('symptoms').nullable(); // JSON
      table.date('date_of_death').notNullable();
      table.float('latitude').notNullable();
      table.float('longitude').notNullable();
      table.string('village').nullable();
      table.string('district').nullable();
      table.text('notes').nullable();
      table.timestamp('created_at').defaultTo(db.fn.now());

      table.index(['latitude', 'longitude']);
      table.index('created_at');
    });
    console.log('[DB] Created table: mortality_reports');
  }

  // 5. Hotspots Table
  if (!(await db.schema.hasTable('hotspots'))) {
    await db.schema.createTable('hotspots', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.float('center_lat').notNullable();
      table.float('center_lng').notNullable();
      table.float('radius_km').defaultTo(5.0);
      table.integer('total_reports').defaultTo(0);
      table.integer('high_risk_reports').defaultTo(0);
      table.text('dominant_symptoms').nullable(); // JSON
      table.string('status').defaultTo('active'); // active, monitoring, resolved
      table.timestamp('detected_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    console.log('[DB] Created table: hotspots');
  }

  // 6. Treatments Table
  if (!(await db.schema.hasTable('treatments'))) {
    await db.schema.createTable('treatments', (table) => {
      table.increments('id').primary();
      table.integer('report_id').references('id').inTable('health_reports').onDelete('CASCADE');
      table.integer('vet_id').references('id').inTable('users');
      table.string('diagnosis').notNullable();
      table.text('prescribed_medicines').nullable();
      table.text('dosage_instructions').nullable();
      table.text('notes').nullable();
      table.string('follow_up_date').nullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('[DB] Created table: treatments');
  }

  // 7. Visits Table
  if (!(await db.schema.hasTable('visits'))) {
    await db.schema.createTable('visits', (table) => {
      table.increments('id').primary();
      table.integer('report_id').references('id').inTable('health_reports').onDelete('CASCADE');
      table.integer('vet_id').references('id').inTable('users');
      table.string('scheduled_date').notNullable();
      table.string('scheduled_time').nullable();
      table.string('status').defaultTo('scheduled'); // scheduled, completed, cancelled
      table.text('notes').nullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('[DB] Created table: visits');
  }

  // 8. Notifications Table
  if (!(await db.schema.hasTable('notifications'))) {
    await db.schema.createTable('notifications', (table) => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE').nullable();
      table.string('role_target').nullable(); // 'all_vets', 'farmers', or specific
      table.integer('report_id').references('id').inTable('health_reports').onDelete('CASCADE').nullable();
      table.integer('hotspot_id').references('id').inTable('hotspots').onDelete('CASCADE').nullable();
      table.string('title').notNullable();
      table.text('message').notNullable();
      table.string('type').defaultTo('high_risk_alert'); // high_risk_alert, hotspot_warning, visit_update, treatment_update
      table.boolean('is_read').defaultTo(false);
      table.timestamp('created_at').defaultTo(db.fn.now());

      table.index('user_id');
      table.index('is_read');
    });
    console.log('[DB] Created table: notifications');
  }

  // 9. Weather Snapshots Table
  if (!(await db.schema.hasTable('weather_snapshots'))) {
    await db.schema.createTable('weather_snapshots', (table) => {
      table.increments('id').primary();
      table.float('latitude').notNullable();
      table.float('longitude').notNullable();
      table.float('temp').notNullable();
      table.float('humidity').notNullable();
      table.float('wind_speed').defaultTo(0);
      table.integer('clouds').defaultTo(0);
      table.string('description').notNullable();
      table.timestamp('recorded_at').defaultTo(db.fn.now());
    });
    console.log('[DB] Created table: weather_snapshots');
  }

  console.log('[DB] Migration complete.');
}

module.exports = migrate;
