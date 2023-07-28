const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");

const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const {SECRET_KEY, BCRYPT_WORK_FACTOR} = require("../config");




/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post("/login", async function (req, res, next) {
  try {
     // assign username and password to what's included in the body of the request
    let {username, password} = req.body
    // if username and password sent in request body are the same as what's in the database, do the following; otherwise throw an error
    if (await User.authenticate(username, password)) {
       // use the username in the request body to generate a new token unique to each user logged in
      let token = jwt.sign({username}, SECRET_KEY);
      // use the updateLoginTimestamp method on class User to update the last_login_at property of the user to the current time
      User.updateLoginTimestamp(username);
      
      return res.json({message: "Logged In!", token})
    } else {
    throw new ExpressError("Invalid username/password", 400);
    } 
  } catch(err) {
    return next(err) 
  }
});


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post("/register", async function (req, res, next) {
    try {
        // assign username to the username included in the body of the request
        const {username} = await User.register(req.body);
        // use the username in the request body to generate a new token unique to each user registered
        const token = jwt.sign({username}, SECRET_KEY);
        // use the updateLoginTimestamp method on class User to update the last_login_at property of the user to the current time
        User.updateLoginTimestamp(username);

        return res.json({token});
        } catch (err) {
          return next(err);
        }
});




module.exports = router;