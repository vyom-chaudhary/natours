const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Audit = require('../models/auditModel');

exports.createLoginAudit = async (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const ipAddress = req.connection.remoteAddress.split(':')[3];

  const audit = await Audit.create({
    user: req.user.id,
    web_browser: req.useragent.browser,
    operating_system: req.useragent.os,
    platform: req.useragent.platform,
    ip_address: ipAddress,
    status: 'active'
  });

  const token = audit.createLoginToken();
  await audit.save();
};
