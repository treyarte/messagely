const express = require('express');
const router = express.Router();
const ExpressError = require('../expressError');
const User = require('../models/user');
const { ensureCorrectUser, ensureLoggedIn } = require('../middleware/auth');

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get('/', ensureLoggedIn, async (req, res, next) => {
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

router.get(
  '/:username',
  ensureLoggedIn,
  ensureCorrectUser,
  async (req, res, next) => {
    try {
      const { username } = req.params;
      const user = await User.get(username);
      if (!user) throw new ExpressError('User not found', 404);
      return res.json({ user: user });
    } catch (error) {
      return next(error);
    }
  }
);

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/to', ensureLoggedIn, async (req, res, next) => {
  try {
    const { username } = req.params;
    const to_messages = await User.messagesTo(username);

    res.json({ messages: to_messages });
  } catch (error) {
    return next(error);
  }
});

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/from', ensureLoggedIn, async (req, res, next) => {
  try {
    const { username } = req.params;

    const messages = await User.messagesFrom(username);

    res.json({ messages });
  } catch (error) {
    return next(error);
  }
});
module.exports = router;
