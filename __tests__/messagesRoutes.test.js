process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../app');
const db = require('../db');
const User = require('../models/user');
const Message = require('../models/message');

let u1, u2, m1;

describe('Message Routes Test', function () {
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

  describe('/GET /messages/:id', () => {
    test('get a single message', async () => {
      const resp1 = await request(app)
        .post(`/auth/login`)
        .send({ username: u2.username, password: 'password' });

      const { token } = resp1.body;
      const resp = await request(app)
        .get(`/messages/${m1.id}`)
        .send({ _token: token });

      expect(resp.body).toEqual({
        message: {
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
          to_user: {
            username: u2.username,
            first_name: u2.first_name,
            last_name: u2.last_name,
            phone: u2.phone,
          },
        },
      });
      expect(resp.statusCode).toBe(200);
    });
  });

  describe('/Create /messages', () => {
    test('create a single message', async () => {
      const resp1 = await request(app)
        .post(`/auth/login`)
        .send({ username: u1.username, password: 'password' });

      const { token } = resp1.body;
      const resp = await request(app).post(`/messages`).send({
        _token: token,
        to_username: u2.username,
        body: 'New Message',
      });

      expect(resp.body).toEqual({
        message: {
          id: expect.any(Number),
          body: 'New Message',
          sent_at: expect.any(String),
          read_at: null,
          from_user: {
            username: u1.username,
            first_name: u1.first_name,
            last_name: u1.last_name,
            phone: u1.phone,
          },
          to_user: {
            username: u2.username,
            first_name: u2.first_name,
            last_name: u2.last_name,
            phone: u2.phone,
          },
        },
      });
      expect(resp.statusCode).toBe(200);
    });
  });

  describe('/POST /:id/read', () => {
    test('mark a message as read by the to user', async () => {
      const resp1 = await request(app)
        .post(`/auth/login`)
        .send({ username: u2.username, password: 'password' });

      const { token } = resp1.body;

      const resp = await request(app)
        .post(`/messages/${m1.id}/read`)
        .send({ _token: token });

      const msg = await Message.get(m1.id);

      expect(msg.read_at).toEqual(expect.any(Date));
      expect(resp.statusCode).toBe(200);
    });

    test('should get a 401 error', async () => {
      const resp1 = await request(app)
        .post(`/auth/login`)
        .send({ username: u1.username, password: 'password' });

      const { token } = resp1.body;

      const resp = await request(app)
        .post(`/messages/${m1.id}/read`)
        .send({ _token: token });

      expect(resp.statusCode).toBe(401);
    });
  });
});

afterAll(async function () {
  await db.end();
});
