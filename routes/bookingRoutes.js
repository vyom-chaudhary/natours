const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authcontroller = require('./../controllers/authContoller');

const router = express.Router();

router.use(authcontroller.protect);
router.get(
  '/checkout-session/:tourId',
  authcontroller.protect,
  bookingController.getCheckoutSession
);
router.use(authcontroller.restrictTo('admin', 'lead-guide'));
router
  .route('/')
  .get(bookingController.getAllBooking)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);
module.exports = router;
