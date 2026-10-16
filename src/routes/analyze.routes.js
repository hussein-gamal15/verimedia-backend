const express = require('express');
const multer = require('multer');
const analyzeController = require('../controllers/analyze.controller');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze', upload.single('image'), analyzeController.analyzeImage);

router.get('/jobs/:job_id/stream', analyzeController.streamJobStatus);

module.exports = router;