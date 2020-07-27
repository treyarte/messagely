const express = require('express');
const router = express.Router();
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
const ExpressError = require('../expressError');
const Message = require('../models/message');
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.params;
    const username = req.user.username;
    const message = await Message.get(id);

    if (
      message.to_user.username === username ||
      message.from_user === username
    ) {
      return res.json({ message });
    }
    throw new ExpressError('Unauthorized access', 401);
  } catch (error) {
    return next(error);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async (req, res, next) => {
  try {
    const { to_username, body } = req.body;
    const from_username = req.user.username;
    const message = await Message.create({ from_username, to_username, body });
    const msg = await Message.get(message.id);

    return res.json({ message: msg });
  } catch (error) {
    return next(error);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', ensureLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.params;
    const msg = await Message.get(id);

    if (msg.to_user.username !== req.user.username) {
      throw new ExpressError('Unauthorized access', 401);
    }

    await Message.markRead(id);

    return res.json({ message: 'Message marked as read' });
  } catch (error) {
    return next(error);
  }
});
module.exports = router;
