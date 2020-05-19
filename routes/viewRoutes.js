const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authContoller');
const bookingcontroller = require('../controllers/bookingController');

const router = express.Router();

router.get(
  '/',
  bookingcontroller.createBookingCheckout,
  authController.isUserLoggedin,
  viewsController.getOverview
);
router.get(
  '/tour/:slug',
  authController.isUserLoggedin,
  viewsController.getTour
);
router.get(
  '/login',
  authController.isUserLoggedin,
  viewsController.getLoginForm
);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);

router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);

module.exports = router;
