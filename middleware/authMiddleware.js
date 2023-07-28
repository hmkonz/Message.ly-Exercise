/** Middleware for handling req authorization for routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** Middleware: Authenticate user. */

function authenticateJWT(req, res, next) {
  try {
    const tokenFromBody = req.body._token;
    const payload = jwt.verify(tokenFromBody, SECRET_KEY);
    req.user = payload; // create a current user
    return next();
  } catch (err) {
    // error in this middleware isn't an error -- continue on
    return next();
  }
}

/** Middleware: Requires user is authenticated (is logged in after confirming token is valid for user) */

function ensureLoggedIn(req, res, next) {
  // if a user isn't logged in (invalid token for that user) return error; otherwise, continue on
  if (!req.user) {
    return next({ status: 401, message: "Unauthorized" });
  } else {
    return next();
  }
}

/** Middleware: Requires correct username */

function ensureCorrectUser(req, res, next) {
  try {
    // if logged-in user's username in database is equal to the username passed in as a parameter (in URL), continue on; otherwise, return an error
    if (req.user.username === req.params.username) {
      return next();
    } else {
      return next({ status: 401, message: "Unauthorized" });
    }
  } catch (err) {
    // errors would happen here if we made a request and req.user is undefined
    return next({ status: 401, message: "Unauthorized" });
  }
}

// end

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser
};
