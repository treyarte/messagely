const express = require('express');
const router = express.Router();
const ExpressError = require('../expressError');
const { SECRET_KEY } = require('../config');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      throw new ExpressError('Username/Password are required', 400);
    if (await User.authenticate(username, password)) {
      User.updateLoginTimestamp(username);

      const token = jwt.sign({ username: username }, SECRET_KEY);
      return res.json({ token: token });
    }

    throw new ExpressError('Invalid username/password combination', 400);
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
