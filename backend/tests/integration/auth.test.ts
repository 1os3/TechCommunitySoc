import request from 'supertest';
import app from '../../src/index';
import User from '../../src/models/User';
import EmailVerification from '../../src/models/EmailVerification';

describe('Authentication Integration Tests', () => {
  const testUser = {
    username: 'testuser123',
    email: 'test@example.com',
    password: 'TestPassword123!',
  };

  const invalidUser = {
    username: 'test',
    email: 'invalid-email',
    password: 'weak',
  };

  beforeEach(async () => {
    // Clean up test data
    await User.destroy({ where: {} });
    await EmailVerification.destroy({ where: {} });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('registered successfully');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.username).toBe(testUser.username);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.is_verified).toBe(false);
      expect(response.body.data.user).not.toHaveProperty('password_hash');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should create email verification token after registration', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      const user = await User.findOne({ where: { email: testUser.email } });
      expect(user).toBeTruthy();

      const verification = await EmailVerification.findOne({
        where: { user_id: user!.id, type: 'verification' },
      });
      expect(verification).toBeTruthy();
      expect(verification!.is_used).toBe(false);
      expect(verification!.expires_at.getTime()).toBeGreaterThan(Date.now());
    });

    it('should hash the password correctly', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      const user = await User.findOne({ where: { email: testUser.email } });
      expect(user).toBeTruthy();
      expect(user!.password_hash).toBeDefined();
      expect(user!.password_hash).not.toBe(testUser.password);
      expect(user!.password_hash.length).toBeGreaterThan(0);
    });

    it('should reject registration with duplicate email', async () => {
      // Register first user
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      // Try to register with same email
      const duplicateUser = {
        ...testUser,
        username: 'differentuser',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateUser)
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error.message).toContain('already exists');
    });

    it('should reject registration with duplicate username', async () => {
      // Register first user
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      // Try to register with same username
      const duplicateUser = {
        ...testUser,
        email: 'different@example.com',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateUser)
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error.message).toContain('already taken');
    });

    it('should validate username requirements', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          username: 'ab', // Too short
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('at least 3 characters');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('valid email address');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          password: 'weak', // Too short and missing requirements
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toMatch(/Password must be at least 8 characters long|Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character/);
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testUser.email,
          // Missing username and password
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Register a test user first
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.username).toBe(testUser.username);
      expect(response.body.data.token).toBeDefined();
      expect(typeof response.body.data.token).toBe('string');
      expect(response.body.data.user.last_login).toBeDefined();
    });

    it('should update last login time', async () => {
      const userBefore = await User.findOne({ where: { email: testUser.email } });
      const lastLoginBefore = userBefore!.last_login;

      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      const userAfter = await User.findOne({ where: { email: testUser.email } });
      
      if (lastLoginBefore) {
        expect(userAfter!.last_login!.getTime()).toBeGreaterThan(lastLoginBefore.getTime());
      } else {
        expect(userAfter!.last_login).not.toBeNull();
      }
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error.message).toBe('Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error.message).toBe('Invalid email or password');
    });

    it('should reject login for inactive user', async () => {
      // Deactivate the user
      await User.update(
        { is_active: false },
        { where: { email: testUser.email } }
      );

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(401);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error.message).toContain('deactivated');
    });

    it('should validate login input format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email-format',
          password: testUser.password,
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/auth/verify-email/:token', () => {
    let verificationToken: string;
    let userId: number;

    beforeEach(async () => {
      // Register a user and get verification token
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      const user = await User.findOne({ where: { email: testUser.email } });
      userId = user!.id;

      const verification = await EmailVerification.findOne({
        where: { user_id: userId, type: 'verification' },
      });
      verificationToken = verification!.token;
    });

    it('should verify email with valid token', async () => {
      const response = await request(app)
        .get(`/api/v1/auth/verify-email/${verificationToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified successfully');
      expect(response.body.data.user.is_verified).toBe(true);

      // Check that user is verified in database
      const user = await User.findByPk(userId);
      expect(user!.is_verified).toBe(true);

      // Check that token is marked as used
      const verification = await EmailVerification.findOne({
        where: { token: verificationToken },
      });
      expect(verification!.is_used).toBe(true);
    });

    it('should reject invalid verification token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/verify-email/invalid-token')
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error.message).toContain('Invalid or expired');
    });

    it('should reject expired verification token', async () => {
      // Expire the token
      await EmailVerification.update(
        { expires_at: new Date(Date.now() - 1000) },
        { where: { token: verificationToken } }
      );

      const response = await request(app)
        .get(`/api/v1/auth/verify-email/${verificationToken}`)
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error.message).toContain('Invalid or expired');
    });

    it('should reject used verification token', async () => {
      // Use the token first
      await request(app)
        .get(`/api/v1/auth/verify-email/${verificationToken}`)
        .expect(200);

      // Try to use it again
      const response = await request(app)
        .get(`/api/v1/auth/verify-email/${verificationToken}`)
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error.message).toContain('Invalid or expired');
    });
  });

  describe('POST /api/v1/auth/resend-verification', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);
    });

    it('should resend verification email for unverified user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/resend-verification')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('sent successfully');

      // Check that new token was created
      const user = await User.findOne({ where: { email: testUser.email } });
      const tokens = await EmailVerification.getUserActiveTokens(user!.id, 'verification');
      expect(tokens.length).toBeGreaterThan(0);
    });

    it('should reject resend for already verified user', async () => {
      // Verify the user first
      const user = await User.findOne({ where: { email: testUser.email } });
      await user!.update({ is_verified: true });

      const response = await request(app)
        .post('/api/v1/auth/resend-verification')
        .send({ email: testUser.email })
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error.message).toContain('already verified');
    });

    it('should reject resend for non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/resend-verification')
        .send({ email: 'nonexistent@example.com' })
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error.message).toBe('User not found');
    });

    it('should require email parameter', async () => {
      const response = await request(app)
        .post('/api/v1/auth/resend-verification')
        .send({})
        .expect(400);

      expect(response.body.error.code).toBe('MISSING_EMAIL');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let authToken: string;

    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      authToken = loginResponse.body.data.token;
    });

    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.username).toBe(testUser.username);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      authToken = loginResponse.body.data.token;
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');
    });

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });
});