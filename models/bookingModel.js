const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'It must belong to Tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'It must belong to user']
    },
    price: {
      type: Number,
      require: [true, 'price is compasary']
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    paid: {
      type: Boolean,
      default: true
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
bookingSchema.pre(/^find/, function(next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name'
  });
  next();
});

const Booking = mongoose.model('booking', bookingSchema);

module.exports = Booking;
