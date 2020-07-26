process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../app');
const db = require('../db');
const User = require('../models/user');
const Message = require('../models/message');

let u1, u2, m1;

describe('User Routes Test', function () {
  beforeEach(async function () {
    await db.query('DELETE FROM messages');
    await db.query('DELETE FROM users');

    u1 = await User.register({
      username: 'test1',
      password: 'password',
      first_name: 'Test1',
      last_name: 'Testy1',
      phone: '+14155550000',
    });
    u2 = await User.register({
      username: 'person',
      password: 'password',
      first_name: 'person',
      last_name: 'test',
      phone: '+14155550000',
    });

    m1 = await Message.create({
      from_username: u1.username,
      to_username: u2.username,
      body: 'Test is a test message',
    });
  });

  describe('/GET users', () => {
    test('get a list of users', async () => {
      const resp = await request(app).get('/users');

      //do not want the password in the get request
      delete u1.password;
      delete u2.password;

      expect(resp.body).toEqual({ users: [u1, u2] });
      expect(resp.statusCode).toBe(200);
    });
  });

  describe('/GET :username', () => {
    test('get a single user by username', async () => {
      const resp = await request(app).get(`/users/${u1.username}`);
      const user = await User.get(u1.username);
      expect(resp.body).toEqual({
        user: {
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          join_at: expect.any(String),
          last_login_at: expect.any(String),
        },
      });
      expect(resp.statusCode).toBe(200);
    });

    test('return 404 for invalid user', async () => {
      const resp = await request(app).get('/users/noexist');

      expect(resp.statusCode).toBe(404);
    });
  });
});

afterAll(async function () {
  await db.end();
});
