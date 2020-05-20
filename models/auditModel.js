const mongoose = require('mongoose');
const crypto = require('crypto');

const auditSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'audit belongs to user']
  },
  login_time: {
    type: Date,
    default: Date.now()
  },
  web_browser: {
    type: String
  },
  operating_system: {
    type: String
  },
  platform: {
    type: String
  },
  ip_address: {
    type: String
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive'],
      message: 'Difficulty is either: easy, medium, difficult'
    }
  },
  device_token: {
    type: String
  }
});
auditSchema.methods.createLoginToken = function() {
  const token = this.web_browser + this.user + this.operating_system;
  this.device_token = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  console.log(token, this.device_token);
  //this.passwordReserExpires = Date.now() + 10 * 60 * 1000;
  return token;
};

const Audit = mongoose.model('audit', auditSchema);

module.exports = Audit;
