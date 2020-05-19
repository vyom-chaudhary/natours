const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authcontroller = require('./../controllers/authContoller');

const router = express.Router({
  mergeParams: true
});

router.use(authcontroller.protect);
router
  .route('/')
  .post(
    authcontroller.restrictTo('user', 'admin'),
    reviewController.setTourUserIds,
    reviewController.createReview
  )
  .get(
    authcontroller.restrictTo('admin', 'lead-guide'),
    reviewController.getReview
  );

router
  .route('/:id')
  .get(reviewController.getoneReview)
  .delete(
    authcontroller.restrictTo('admin', 'user'),
    reviewController.deleteReview
  )
  .patch(
    authcontroller.restrictTo('admin', 'user'),
    reviewController.updateReview
  );

module.exports = router;
