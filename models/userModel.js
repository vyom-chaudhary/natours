const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'first name is compasary']
  },
  email: {
    type: String,
    required: [true, 'email is compasary'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'please provide valid email']
  },
  photo: { type: String, default: 'default.jpg' },
  Role: {
    type: String,
    default: 'user',
    enum: ['user', 'guide', 'lead-guide', 'admin']
  },

  password: {
    type: String,
    required: [true, 'password is compasary'],
    minlength: 8,
    select: false
  },
  confirmPassword: {
    type: String,
    required: [true, 'password is compasary'],
    minlength: 8,
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'password are not same'
    }
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: String,
  passwordReserExpires: Date,
  active: {
    type: Boolean,
    default: true
  }
});

userSchema.pre('save', async function(next) {
  //only run this function if password was actually modified
  if (!this.isModified('password')) return next();
  //hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  //delete passwordconfirm
  this.confirmPassword = undefined;
});
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimestamp, JWTTimestamp); ////changedTimestamp= when user change password time ,JWTTimestamp = means token is issued
    return changedTimestamp > JWTTimestamp;
    /////false means not changed  true means changed
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log(resetToken, this.passwordResetToken);
  this.passwordReserExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
