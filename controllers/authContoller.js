const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const User = require('./../models/userModel');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_IN
  });
};
const createSendToken = (user, statuscode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expire: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),

    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statuscode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.create(
    // {
    //   firstName: req.body.firstName,
    //   lastName: req.body.lastName,
    //   email: req.body.email,
    //   phone: req.body.phone,
    //   password: req.body.password,
    //   confirmPassword: req.body.confirmPassword,
    //   passwordChangedAt: req.body.passwordChangedAt
    // }
    req.body
  );
  const url = `${req.protocol}://${req.get('host')}/me`;
  //console.log(url);
  await new Email(user, url).sendWelcome();
  createSendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({
    status: 'success'
  });
};

exports.photos = catchAsync(async (req, res, next) => {
  try {
    //  const token = signToken(user._id);

    res.status(201).json({
      status: 'success',

      data: {
        user: req.file
      }
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error
    });
  }
  next();
});

exports.protect = catchAsync(async (req, res, next) => {
  ///1)) check token it is availale or not
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('you are not logged in log in to access', 401));
  }

  ////verification step token is valid or not

  const encoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  ////check user still exist or not
  const currrentUser = await User.findById(encoded.id);

  if (!currrentUser) {
    return next(
      new AppError('The user belonging to this token no more exist', 401)
    );
  }

  ////check if user changed password after the token was issued

  if (await currrentUser.changedPasswordAfter(encoded.iat)) {
    return next(
      new AppError('User recently change password ! please log in again', 401)
    );
  }
  req.user = currrentUser;
  res.locals.user = currrentUser;
  next();
});

exports.isUserLoggedin = async (req, res, next) => {
  try {
    ///1)) check token it is availale or not
    if (req.cookies.jwt) {
      ////verification step token is valid or not

      const encoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      ////check user still exist or not
      const currrentUser = await User.findById(encoded.id);

      if (!currrentUser) {
        return next();
      }

      ////check if user changed password after the token was issued

      if (await currrentUser.changedPasswordAfter(encoded.iat)) {
        return next();
      }
      res.locals.user = currrentUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.Role)) {
      return next(
        new AppError('you do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgetpassword = catchAsync(async (req, res, next) => {
  //1) get user on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('there is no user with this email address', 404));
  }

  ///2) genetare the random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3)send it to user email

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetpassword/${resetToken}`;

  //const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await new Email(user, resetURL).sendPasswordReset();
    // await sendEmail({
    //   email: user.email,
    //   subject: 'your password reset token(valid for 10 mins)',
    //   message
    //});

    res.status(200).json({
      status: 'success',
      message: 'token sent to email '
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordReserExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There is an error to sending a email try again later', 500)
    );
  }
});

exports.resetpassword = catchAsync(async (req, res, next) => {
  //1)) get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordReserExpires: { $gt: Date.now() }
  });

  //2)) If token is not expired and there is user set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordReserExpires = undefined;
  await user.save();

  //3))update change password property for the user
  //4 )) log the user in ,send JWT
  createSendToken(user, 200, res);
});

exports.updatepassword = catchAsync(async (req, res, next) => {
  // 1 ))) get user from collection

  const currrentUser = await User.findById(req.user.id).select('+password');

  // 2 ))) check if posted current password is correct
  const currentPassword = req.body.currentpassword;

  if (
    !(await currrentUser.correctPassword(
      currentPassword,
      currrentUser.password
    ))
  ) {
    return next(new AppError('Incorrect current password', 401));
  }

  // 3 ))) if so,update password

  currrentUser.password = req.body.password;
  currrentUser.confirmPassword = req.body.confirmPassword;
  currrentUser.passwordResetToken = undefined;
  currrentUser.passwordReserExpires = undefined;
  await currrentUser.save();

  // 4 ))) log the user in ,send JWT
  createSendToken(currrentUser, 200, res);
});
