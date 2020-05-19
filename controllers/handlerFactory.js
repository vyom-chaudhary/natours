const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('there is no data related thid id', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });
exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });
exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    // const newTour = new Tour({})
    // newTour.save()

    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    ///const tour = await Model.findById(req.params.id).populate('reviews');
    // Tour.findOne({ _id: req.params.id })

    if (!doc) {
      return next(new AppError('there is no data related this id', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });
exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    ///for getting nested review
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        doc
      }
    });
  });
exports.importMany = (Model, doc) => async () => {
  try {
    await Model.create(doc);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
