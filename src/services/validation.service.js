const crypto = require('crypto');

class ValidationService {
  static validateMagicBytes(buffer, mimetype) {
    if (!buffer || buffer.length < 4) return false;

    const isJPEG = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWEBP = buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP';

    if (mimetype === 'image/jpeg' && isJPEG) return true;
    if (mimetype === 'image/png' && isPNG) return true;
    if (mimetype === 'image/webp' && isWEBP) return true;

    return false;
  }

  // حساب بصمة التشفير SHA-256
  static calculateSHA256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}

module.exports = ValidationService;