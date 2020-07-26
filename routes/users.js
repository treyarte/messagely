const express = require('express');
const router = express.Router();
const ExpressError = require('../expressError');
const User = require('../models/user');

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get('/', async (req, res, next) => {
  try {
    const results = await User.all();
    const users = results.map((u) => {
      return {
        username: u.username,
        first_name: u.first_name,
        last_name: u.last_name,
        phone: u.phone,
      };
    });
    return res.json({ users: users });
  } catch (error) {
    return next(error);
  }
});

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get('/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.get(username);
    if (!user) throw new ExpressError('User not found', 404);
    return res.json({ user: user });
  } catch (error) {
    return next(error);
  }
});

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
module.exports = router;
