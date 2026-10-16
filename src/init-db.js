const pool = require('./config/db');

const createTablesQuery = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      hashed_password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'analyst',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS media_assets (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      original_filename VARCHAR(255) NOT NULL,
      storage_path VARCHAR(512) NOT NULL,
      mime_type VARCHAR(50) NOT NULL,
      file_size_bytes BIGINT NOT NULL,
      sha256_hash VARCHAR(64) NOT NULL,
      width INT,
      height INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS analysis_jobs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'QUEUED',
      queued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      error_log TEXT
  );

  CREATE TABLE IF NOT EXISTS forensic_results (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      job_id UUID UNIQUE REFERENCES analysis_jobs(id) ON DELETE CASCADE,
      ela_variance_score FLOAT,
      ela_artifact_path VARCHAR(512),
      fft_pattern_detected BOOLEAN,
      fft_energy_ratio FLOAT,
      fft_spectrum_path VARCHAR(512),
      editing_software VARCHAR(100)
  );

  CREATE TABLE IF NOT EXISTS ai_inference_results (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      job_id UUID UNIQUE REFERENCES analysis_jobs(id) ON DELETE CASCADE,
      model_name VARCHAR(100),
      ai_probability FLOAT,
      gradcam_heatmap_path VARCHAR(512),
      inference_time_ms INT
  );

  CREATE TABLE IF NOT EXISTS evaluation_reports (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      job_id UUID UNIQUE REFERENCES analysis_jobs(id) ON DELETE CASCADE,
      trust_score FLOAT,
      verdict VARCHAR(50),
      weights_configuration JSONB,
      pdf_report_path VARCHAR(512),
      pdf_sha256_sig VARCHAR(64),
      issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

async function setupDatabase() {
  try {
    console.log('Building database schema and tables...');
    await pool.query(createTablesQuery);
    console.log(' All 6 tables created successfully in PostgreSQL!');
    process.exit(0);
  } catch (error) {
    console.error(' Error creating tables:', error);
    process.exit(1);
  }
}

setupDatabase();