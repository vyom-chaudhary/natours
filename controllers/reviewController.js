const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
//const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

exports.setTourUserIds = catchAsync(async (req, res, next) => {
  //allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
});

exports.createReview = factory.createOne(Review);

exports.getReview = factory.getAll(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);

exports.getoneReview = factory.getOne(Review);
