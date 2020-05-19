const express = require('express');

//const fs = require('fs');

//const multer = require('multer');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authContoller');

// const storage = multer.diskStorage({
//   filename: function(req, file, cb) {
//     const mkfilename = file.mimetype.substr(file.mimetype.indexOf('/') + 1);
//     cb(null, `${Date.now()}.${mkfilename}`);
//     //cb(null, file.originalname);
//   },
//   destination: function(req, file, cb) {
//     const d = new Date();

//     const dir = `${'public/img/users' +
//       '/'}${d.getDate()}_${d.getUTCMonth()}_${d.getFullYear()}`;

//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir);
//     }
//     cb(null, dir);
//   }
// });

// const upload = multer({ storage: storage });

const router = express.Router();

router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.route('/logout').get(authController.logout);

router.route('/forgetpassword').post(authController.forgetpassword);
router.route('/resetpassword/:token').patch(authController.resetpassword);

//protect all routes
router.use(authController.protect);
router.route('/updatepassword').patch(authController.updatepassword);
router.route('/me').get(userController.getMe, userController.getUser);
router
  .route('/updateMe')
  .patch(
    userController.uploadUserPhoto,
    userController.reSizeUserPhoto,
    userController.updateMe
  );
router.route('/deleteMe').delete(userController.deleteMe);

//router.route('/upload').post(upload.array('video', 10), authController.photos);

router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
