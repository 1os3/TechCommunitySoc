import request from 'supertest';
import app from '../../src/index';
import User from '../../src/models/User';
import EmailVerification from '../../src/models/EmailVerification';

describe('Password Reset Integration Tests', () => {
  const testUser = {
    username: 'resetuser',
    email: 'reset@example.com',
    password: 'TestPassword123!',
  };

  beforeEach(async () => {
    // Clean up test data
    await User.destroy({ where: {} });
    await EmailVerification.destroy({ where: {} });

    // Create a test user
    await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should send password reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link has been sent');

      // Check that reset token was created
      const user = await User.findOne({ where: { email: testUser.email } });
      expect(user).toBeTruthy();

      const resetToken = await EmailVerification.findOne({
        where: { user_id: user!.id, type: 'password_reset' },
      });
      expect(resetToken).toBeTruthy();
      expect(resetToken!.is_used).toBe(false);
      expect(resetToken!.expires_at.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return success even for non-existent user (security)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link has been sent');

      // Ensure no token was created
      const tokens = await EmailVerification.findAll({
        where: { type: 'password_reset' },
      });
      expect(tokens.length).toBe(0);
    });

    it('should reject password reset for deactivated user', async () => {
      // Deactivate the user
      await User.update(
        { is_active: false },
        { where: { email: testUser.email } }
      );

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error.message).toContain('deactivated');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('valid email address');
    });

    it('should require email parameter', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({})
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Email is required');
    });
  });

  describe('POST /api/v1/auth/reset-password/:token', () => {
    let resetToken: string;
    let userId: number;

    beforeEach(async () => {
      // Get reset token
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      const user = await User.findOne({ where: { email: testUser.email } });
      userId = user!.id;

      const tokenRecord = await EmailVerification.findOne({
        where: { user_id: userId, type: 'password_reset' },
      });
      resetToken = tokenRecord!.token;
    });

    it('should reset password with valid token and password', async () => {
      const newPassword = 'NewPassword456!';

      const response = await request(app)
        .post(`/api/v1/auth/reset-password/${resetToken}`)
        .send({ newPassword })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset successfully');

      // Check that token is marked as used
      const tokenRecord = await EmailVerification.findOne({
        where: { token: resetToken },
      });
      expect(tokenRecord!.is_used).toBe(true);

      // Verify old password no longer works
      const oldLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(401);

      expect(oldLoginResponse.body.success).toBeFalsy();

      // Verify new password works
      const newLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: newPassword,
        })
        .expect(200);

      expect(newLoginResponse.body.success).toBe(true);
      expect(newLoginResponse.body.data.token).toBeDefined();
    });

    it('should reject reset with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password/invalid-token')
        .send({ newPassword: 'NewPassword456!' })
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error.message).toContain('Invalid or expired');
    });

    it('should reject reset with expired token', async () => {
      // Expire the token
      await EmailVerification.update(
        { expires_at: new Date(Date.now() - 1000) },
        { where: { token: resetToken } }
      );

      const response = await request(app)
        .post(`/api/v1/auth/reset-password/${resetToken}`)
        .send({ newPassword: 'NewPassword456!' })
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error.message).toContain('Invalid or expired');
    });

    it('should reject reset with used token', async () => {
      // Use the token first
      await request(app)
        .post(`/api/v1/auth/reset-password/${resetToken}`)
        .send({ newPassword: 'NewPassword456!' })
        .expect(200);

      // Try to use it again
      const response = await request(app)
        .post(`/api/v1/auth/reset-password/${resetToken}`)
        .send({ newPassword: 'AnotherPassword789!' })
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error.message).toContain('Invalid or expired');
    });

    it('should validate new password strength', async () => {
      const response = await request(app)
        .post(`/api/v1/auth/reset-password/${resetToken}`)
        .send({ newPassword: 'weak' })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toMatch(/Password must be at least 8 characters long|Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character/);
    });

    it('should require new password parameter', async () => {
      const response = await request(app)
        .post(`/api/v1/auth/reset-password/${resetToken}`)
        .send({})
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('New password is required');
    });

    it('should reject reset for deactivated user', async () => {
      // Deactivate the user
      await User.update(
        { is_active: false },
        { where: { id: userId } }
      );

      const response = await request(app)
        .post(`/api/v1/auth/reset-password/${resetToken}`)
        .send({ newPassword: 'NewPassword456!' })
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error.message).toContain('deactivated');
    });
  });

  describe('Password Reset Security', () => {
    it('should create different tokens for multiple reset requests', async () => {
      // First reset request
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      const firstToken = await EmailVerification.findOne({
        where: { type: 'password_reset' },
        order: [['created_at', 'DESC']],
      });

      // Second reset request
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      const secondToken = await EmailVerification.findOne({
        where: { type: 'password_reset' },
        order: [['created_at', 'DESC']],
      });

      expect(firstToken!.token).not.toBe(secondToken!.token);
    });

    it('should have short expiry time for reset tokens', async () => {
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      const token = await EmailVerification.findOne({
        where: { type: 'password_reset' },
      });

      const expiryTime = token!.expires_at.getTime();
      const currentTime = Date.now();
      const oneHour = 60 * 60 * 1000;

      // Should expire within 1 hour (with some tolerance)
      expect(expiryTime - currentTime).toBeLessThanOrEqual(oneHour + 5000);
      expect(expiryTime - currentTime).toBeGreaterThan(oneHour - 5000);
    });
  });
});