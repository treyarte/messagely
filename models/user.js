const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require('../config');
const ExpressError = require('../expressError');

/** User class for message.ly */

/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const join_at = new Date();
    const last_login_at = new Date();
    const results = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING username, password, first_name, last_name, phone`,
      [
        username,
        hashedPassword,
        first_name,
        last_name,
        phone,
        join_at,
        last_login_at,
      ]
    );

    return results.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const results = await db.query(
      `SELECT username, password FROM 
      users WHERE username = $1`,
      [username]
    );

    const user = results.rows[0];

    if (user) {
      if (await bcrypt.compare(password, user.password)) {
        return true;
      }
    }
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const results = await db.query(
      'UPDATE users SET last_login_at=$1 WHERE username=$2 RETURNING last_login_at',
      [new Date(), username]
    );

    return results.rows[0];
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone
      FROM users`
    );
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username = $1`,
      [username]
    );
    return results.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const results = await db.query(
      `SELECT id, to_username, body, sent_at, read_at 
      FROM messages 
      INNER JOIN users on messages.from_username = users.username
      WHERE messages.from_username = $1`,
      [username]
    );

    let messages = results.rows;

    let to_usernames = results.rows.map((m) => m.to_username);

    const users = await this.mapUsers(to_usernames);

    const messagesFrom = messages.map((message) => {
      const to_user = users.get(message.to_username);
      return {
        id: message.id,
        to_user,
        body: message.body,
        sent_at: message.sent_at,
        read_at: message.read_at,
      };
    });

    return messagesFrom;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(
      `SELECT id, from_username, body, sent_at, read_at 
      FROM messages 
      INNER JOIN users on messages.to_username = users.username
      WHERE messages.to_username = $1`,
      [username]
    );

    let messages = results.rows;
    let from_usernames = results.rows.map((m) => m.from_username);

    const users = await this.mapUsers(from_usernames);

    const messagesTo = messages.map((message) => {
      const from_user = users.get(message.from_username);
      return {
        id: message.id,
        from_user,
        body: message.body,
        sent_at: message.sent_at,
        read_at: message.read_at,
      };
    });

    return messagesTo;
  }

  /**
   * take a list of usernames and find the user and then make them into a map
   */
  static async mapUsers(usernames) {
    const users = new Map();
    for (let username of usernames) {
      const results = await db.query(
        `SELECT username, first_name, last_name, phone
        FROM users WHERE username = $1`,
        [username]
      );
      users.set(username, results.rows[0]);
    }
    return users;
  }
}

module.exports = User;
