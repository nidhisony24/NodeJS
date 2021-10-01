const { promisify } = require("util");
const AppError = require("../utils/appError");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const CryptoRandomString = require("crypto-random-string");
const UserTransformer = require("../transformers/UserTransformer");

var mailer = require("../config/nodemailer");
var ejs = require("ejs");

const User = require("../models/User");
const UserToken = require("../models/UserToken");
const UserOtp = require("../models/UserOtp");
const UserAcivationCode = require("../models/UserActivationCode");
const { webBaseUrl } = require("../utils/WebData");
const helpers = require("../utils/helpers");

exports.login = async (req, res, next) => {
  try {

    let validateUserLogin = await validateLoginRequest(req, res, next);

    if (!validateUserLogin.validation) {
      return validateUserLogin.failValidationData;
    }
    let user = validateUserLogin.user;
    let userData = UserTransformer.transform(user);
    // All correct, send jwt to client
    const token = createToken(userData);

    // Add token to database
    await UserToken.query().insert({
      user_id: user.id,
      token: token
    });

    res.status(200).json({
      status: true,
      message: "Login successful.",
      data: {
        accessToken: token,
        user: userData,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.signup = async (req, res, next) => {
  try {
    // Validation step
    let validateRegister = await validateRegisterRequest(req, res, next);

    if(!validateRegister.validation) {
      return validateRegister.failValidationData;
    }

    const { name, username, email, password, } = req.body;

    // Create User table record
    const user = await User.query().insert({
      role: "member",
      name: name,
      email: email,
      username: username,
      password: await bcrypt.hash(password, 12),
      status: 0,
    });


    user.password = undefined;

    // Create dependent table records

    let code = await generateRandomCode();

    await UserAcivationCode.query().insert({
      user_id: user.id,
      code: code
    });

    let link = webBaseUrl + '/user-activation/' + code;

    sendMail(email, {name, link}, "./email_templates/registration_verify.ejs", 'Moontower Verification Link');

    res.status(200).json({
      status: true,
      message: "Account activation link is sent to your email.",
      data: {
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyAccount = async (req, res, next) => {
  try {
    const code = req.body.code;
    let UserCode = await UserAcivationCode.query().where("code", code).first();
    if (!UserCode) {
      return next(
        new AppError(403, false, "The user is already activated."), req, res, next);
    }

    await User.query().findById(UserCode.user_id).patch({
      status: 1
    });

    let userData = await User.query().findById(UserCode.user_id);
    let user = UserTransformer.transform(userData);

    await UserAcivationCode.query().delete().findById(UserCode.id);

    res.status(200).json({
      status: true,
      message: "Account is activated successfully.",
      data: {
        user: user,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    // 1) check if the token is there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    await UserToken.query().delete().where('token',token);

    res.status(200).json({
      status: "success",
      message: "Logout successful.",
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

exports.ForgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    let validateFPassword = await validateForgotPassword(req, res, next);

    if (!validateFPassword.validation) {
      return validateFPassword.failValidationData;
    }
    let user = validateFPassword.user;

    let otp = Math.floor(100000 + Math.random() * 900000);

    insertOtp(otp, user);

    let link = webBaseUrl + '/reset-password/' + otp;

    // Send link or just OTP to verify. Having both functions here. Verify OTP and verify Reset password link. Can send link or OTP in email.

    sendMail(email, { name: user.toJSON().name, otp: otp, username: user.email, link : link }, "./email_templates/forgot_password_otp.ejs", 'Yurgo Reset Password OTP');

    res.status(200).json({
      status: "success",
      message: "Password reset verification code has been sent to the email.",
      data: {
        otp
      },
    });
  } catch (err) {
    next(err);
  }
};

const validateForgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // 1) check if all mandatory fields exist and email is valid
    if (!email) {
      return {
        validation: false,
        failValidationData: next(
            new AppError(404, "fail", "Please provide email."), req, res, next)
      };
    }
    let user = await User.query().where({ email: email }).first();

    if (!user) {
      return {
        validation: false,
        failValidationData: next(
            new AppError(403, "fail", "Account does not exist."), req, res, next)
      };
    }

    if (user.toJSON().status != 1) {
      return {
        validation: false,
        failValidationData: next(
            new AppError(403, "fail", "Account inactive."), req, res, next)
      };
    }

    return { validation: true, user };

  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    let validateChangePass = await validateChangePassword(req, res, next);

    if (!validateChangePass.validation) {
      return validateChangePass.failValidationData;
    }

    let user = validateChangePass.user;

    let new_password = await bcrypt.hash(password, 12);
    await User.query().findById(user.id).patch({
      password: new_password
    });

    res.status(200).json({
      status: "success",
      message: "Password reset successful.",
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

exports.protect = async (req, res, next) => {
  try {
    let validateToken = await validateUserToken(req, res, next);

    if (!validateToken.validation) {
      return validateToken.failValidationData;
    }
    let user = validateToken.user;

    req.user = UserTransformer.transform(user);

    next();
  } catch (err) {
    next(err);
  }
};

let validateLoginRequest = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    let role = req.body.from ? "admin" : "member";
    // check if email and password exist
    if (!email || !password) {
      return {
        validation: false,
        failValidationData: next(
          new AppError(404, false, "Please provide email and password."),
            req,
            res,
            next
        )
      };
    }

    // check if user exist and password is correct
    const user = await User.query().where('email', email).where("role", role).first();

    if (!user) {

      return {
        validation: false,
        failValidationData: next(
          new AppError(403, false, "User credentials are invalid."),
            req,
            res,
            next
        )
      };
    }
    if (user.toJSON().deleted_at) {
      return {
        validation: false,
        failValidationData: next(
        new AppError(403, false, "Account suspended."),
          req,
          res,
          next
        )
      };
    }
    if (!(bcrypt.compareSync(password, user.password))) {

      return {
        validation: false,
        failValidationData: next(
          new AppError(403, false, "The user credentials are invalid."),
          req,
          res,
          next
        )
      };
    }
    if (user.toJSON().status == 0) {
      return {
        validation: false,
        failValidationData: next(
        new AppError(403, false, "The account is not verified yet."),
          req,
          res,
          next
        )
      };
    }

    return { validation: true, user };

  } catch (error) {
    next(error);

  }
};

const validateRegisterRequest = async (req, res, next) => {
  try {
    const { name, username, email, password, } = req.body;

    // 1) check if all mandatory fields exist and email is unique
    if (
      !email ||
      !password ||
      !name ||
      !username
    ) {
      return {
        validation: false,
        failValidationData: next(
          new AppError(404, false, "Please provide mandatory data."),
            req,
            res,
            next
        )
      };
    }
    if (await User.query().where('email', email).first()) {
      return {
        validation: false,
        failValidationData: next(
          new AppError(
            403,
            false,
            "Given email address belongs to another user record. Please use a different email."
          ),
          req,
          res,
          next
        )
      };
    }

    if (await User.query().where('username', username).first()) {
      return {
        validation: false,
        failValidationData: next(
          new AppError(
            403,
            false,
            "Given username belongs to another user record. Please use a different email."
          ),
          req,
          res,
          next
        )
      };
    }

    return { validation: true };

  } catch (error) {
    next(error);
  }
};

const validateChangePassword = async (req, res, next) => {
  try {
    const { password, otp } = req.body;

    if (!password) {
      return {
        validation: false,
        failValidationData: next(new AppError(404, "fail", "Please provide password."), req, res, next)
      };
    }

    if (!otp) {
      return {
        validation: false,
        failValidationData: next(new AppError(404, "fail", "You are not authorized."), req, res, next)
      };
    }

    let userOtp = await UserOtp.query().where({
      otp: otp
    }).first();

    if (!userOtp) {
      return {
        validation: false,
        failValidationData: next(new AppError(403, "fail", "Invalid link."), req, res, next)
      };
    }

    let user = await User.query().where('id',userOtp.user_id).first();

    if (!user) {
      return {
        validation: false,
        failValidationData: next(new AppError(403, "fail", "Invalid user."), req, res, next)
      };
    }

    await UserOtp.query().delete().where({
      otp: otp
    });

    return { validation: true, user };

  } catch (error) {
    next(error);
  }
};

const validateUserToken = async (req, res, next) => {
  try {
    // check if the token is there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return {
        validation: false,
        failValidationData: next(
        new AppError(401, "fail", "You are not logged in! Please login in to continue."), req, res, next)
      };
    }

    // Verify token
    let decode;
    try {
      decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    } catch (error) {
      return {
        validation: false,
        failValidationData: next(
        new AppError(401, "fail", "Session Expired."), req, res, next)
      };
    }

    let db_token = await UserToken.query().where({
      user_id: decode.id,
      token: token,
    }).first();

    if (!db_token) {
      return {
        validation: false,
        failValidationData: next(new AppError(401, "fail", "Invalid token."), req, res, next)
      };
    }
    // check if the user exists (not deleted)
    const user = await User.query().where({
      id: decode.id,
      status: 1,
    }).first();
    if (!user) {
      return {
        validation: false,
        failValidationData: next(
        new AppError(401, "fail", "This user is no longer exist."), req, res, next)
      };
    }

    return { validation: true, user };
  } catch (error) {
    next(error);
  }
};

const generateRandomCode = async () => {
  try {
    let code = null;

    code = CryptoRandomString(25);

    let userCode = await UserAcivationCode.query().where('code', code).first();

    if (userCode) {
      await generateRandomCode();
    }

    return code;

  } catch (error) {
    console.log(error);
  }
};

const createToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const insertOtp = async (otp, user) => {
  let userOtp = await UserOtp.query().where('user_id', user.id).first();
    if (userOtp) {
      await UserOtp.query().findById(userOtp.id).patch({
        otp: otp
      });
    } else {
      await UserOtp.query().insert(
        {
          user_id: user.id,
          otp: otp,
        },
      );
    }
};

const sendMail = (email, info, file_path, subject) => {
  ejs.renderFile(file_path, info, function (err, data) {
      if (err) {
          console.log(err);
      } else {
        mailer.sendWithTemplate(email, subject, data);
      }
    });
};

exports.validateForgetPasswordLink = async (req, res, next) => {

  const { otp } = req.body;

  let codeData = await UserOtp.query().where("token", otp).first();

  if(!codeData){
    return {
      validation: false,
      failValidationData: next(new AppError(403, "fail", "Invalid link."), req, res, next)
    };
  }

  res.status(200).json({
    status: "success",
    message: "Link verified successfully.",
  });

}