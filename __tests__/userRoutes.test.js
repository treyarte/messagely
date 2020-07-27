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
      const resp1 = await request(app)
        .post(`/auth/login`)
        .send({ username: u2.username, password: 'password' });

      const { token } = resp1.body;

      const resp = await request(app).get('/users').send({ _token: token });

      //do not want the password in the get request
      delete u1.password;
      delete u2.password;

      expect(resp.body).toEqual({ users: [u1, u2] });
      expect(resp.statusCode).toBe(200);
    });
  });

  describe('/GET :username', () => {
    test('get a single user by username', async () => {
      const resp1 = await request(app)
        .post(`/auth/login`)
        .send({ username: u1.username, password: 'password' });

      const { token } = resp1.body;

      const resp = await request(app)
        .get(`/users/${u1.username}`)
        .send({ _token: token });
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

      expect(resp.statusCode).toBe(401);
    });
  });

  describe('/GET :username/to', () => {
    test('get messages that was sent to that user', async () => {
      const resp1 = await request(app)
        .post(`/auth/login`)
        .send({ username: u2.username, password: 'password' });

      const { token } = resp1.body;

      const resp = await request(app)
        .get(`/users/${u2.username}/to`)
        .send({ _token: token });

      expect(resp.body).toEqual({
        messages: [
          {
            id: m1.id,
            body: m1.body,
            sent_at: expect.any(String),
            read_at: null,
            from_user: {
              username: u1.username,
              first_name: u1.first_name,
              last_name: u1.last_name,
              phone: u1.phone,
            },
          },
        ],
      });

      expect(resp.statusCode).toBe(200);
    });
  });

  describe('/GET :username/from', () => {
    test('get all messages a user has sent', async () => {
      const resp1 = await request(app)
        .post(`/auth/login`)
        .send({ username: u2.username, password: 'password' });

      const { token } = resp1.body;

      const resp = await request(app)
        .get(`/users/${u1.username}/from`)
        .send({ _token: token });

      expect(resp.body).toEqual({
        messages: [
          {
            id: m1.id,
            body: m1.body,
            sent_at: expect.any(String),
            read_at: null,
            to_user: {
              username: u2.username,
              first_name: u2.first_name,
              last_name: u2.last_name,
              phone: u2.phone,
            },
          },
        ],
      });

      expect(resp.statusCode).toBe(200);
    });
  });
});

afterAll(async function () {
  await db.end();
});
