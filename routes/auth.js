const express = require('express');
const router = express.Router();
const ExpressError = require('../expressError');
const { SECRET_KEY } = require('../config');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser,
} = require('../middleware/auth');
/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req, res, next) => {
  try {
  } catch (error) {
    return next(error);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post('/register', async function (req, res, next) {
  try {
    const { username, password, first_name, last_name, phone } = req.body;
    if (!password) throw new ExpressError('password is required', 400);
    console.log(password);
    const user = await User.register({
      username,
      password,
      first_name,
      last_name,
      phone,
    });

    const token = jwt.sign({ username: user.username }, SECRET_KEY);
    return res.json({ token: token });
  } catch (error) {
    if (error.code === '23505') {
      return next(new ExpressError('Username is already in use', 400));
    }
    return next(error);
  }
});

module.exports = router;
