const { Queue } = require('bullmq');
const IORedis = require('ioredis');
require('dotenv').config();

const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  maxRetriesPerRequest: null,
});

const analysisQueue = new Queue('analysisQueue', { connection });

module.exports = { connection, analysisQueue };