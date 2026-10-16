const db = require('../config/db');
const { analysisQueue } = require('../config/redis');
const ValidationService = require('../services/validation.service');


exports.analyzeImage = async (req, res) => {
  try {
    const file = req.file;

    
    if (!file) {
      return res.status(400).json({ error: 'Image file is required.' });
    }

    if (file.size > 15 * 1024 * 1024) {
      return res.status(400).json({ error: 'Payload exceeds 15 MB limit.' });
    }

    
    const isValidImage = ValidationService.validateMagicBytes(file.buffer, file.mimetype);
    if (!isValidImage) {
      return res.status(400).json({ error: 'Invalid or forged image file.' });
    }

   
    const fileHash = ValidationService.calculateSHA256(file.buffer);

   
    const storagePath = `uploads/${Date.now()}_${file.originalname}`;

    const assetResult = await db.query(
      `INSERT INTO media_assets (original_filename, storage_path, mime_type, file_size_bytes, sha256_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [file.originalname, storagePath, file.mimetype, file.size, fileHash]
    );
    const assetId = assetResult.rows[0].id;

   
    const jobResult = await db.query(
      `INSERT INTO analysis_jobs (asset_id, status)
       VALUES ($1, 'QUEUED') RETURNING id`,
      [assetId]
    );
    const jobId = jobResult.rows[0].id;

   
    await analysisQueue.add(
      'process_image',
      {
        jobId: jobId,
        assetId: assetId,
        storagePath: storagePath,
        fileHash: fileHash,
      },
      {
        jobId: jobId,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );

   
    return res.status(202).json({
      message: 'Image accepted and queued for analysis.',
      job_id: jobId,
      sha256_hash: fileHash,
      status: 'QUEUED',
    });
  } catch (error) {
    console.error('Error in analyzeImage:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.streamJobStatus = async (req, res) => {
  const { job_id } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const intervalId = setInterval(async () => {
    try {
      const result = await db.query(
        'SELECT status, completed_at, error_log FROM analysis_jobs WHERE id = $1',
        [job_id]
      );

      if (result.rows.length === 0) {
        res.write(`data: ${JSON.stringify({ error: 'Job not found' })}\n\n`);
        clearInterval(intervalId);
        return res.end();
      }

      const job = result.rows[0];
      res.write(`data: ${JSON.stringify(job)}\n\n`);

      if (job.status === 'COMPLETED' || job.status === 'FAILED') {
        clearInterval(intervalId);
        res.end();
      }
    } catch (err) {
      clearInterval(intervalId);
      res.end();
    }
  }, 1000);

  req.on('close', () => {
    clearInterval(intervalId);
  });
};