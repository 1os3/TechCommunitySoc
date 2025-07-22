import EmailVerification from '../../src/models/EmailVerification';
import User from '../../src/models/User';

describe('EmailVerification Model', () => {
  let testUser: User;

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashedpassword123',
    });
  });

  describe('Token Generation', () => {
    it('should generate a secure token', () => {
      const token = EmailVerification.generateSecureToken();
      expect(token).toHaveLength(64); // 32 bytes = 64 hex characters
      expect(typeof token).toBe('string');
    });

    it('should generate unique tokens', () => {
      const token1 = EmailVerification.generateSecureToken();
      const token2 = EmailVerification.generateSecureToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('Token Creation', () => {
    it('should create a verification token', async () => {
      const verification = await EmailVerification.createVerificationToken(testUser.id, 'verification');
      
      expect(verification.user_id).toBe(testUser.id);
      expect(verification.type).toBe('verification');
      expect(verification.token).toHaveLength(64);
      expect(verification.is_used).toBe(false);
      expect(verification.expires_at).toBeInstanceOf(Date);
      expect(verification.expires_at.getTime()).toBeGreaterThan(Date.now());
    });

    it('should create a password reset token', async () => {
      const verification = await EmailVerification.createVerificationToken(testUser.id, 'password_reset', 2);
      
      expect(verification.type).toBe('password_reset');
      expect(verification.expires_at.getTime()).toBeGreaterThan(Date.now());
      expect(verification.expires_at.getTime()).toBeLessThan(Date.now() + 3 * 60 * 60 * 1000); // Less than 3 hours
    });

    it('should invalidate existing tokens when creating new ones', async () => {
      const firstToken = await EmailVerification.createVerificationToken(testUser.id, 'verification');
      const secondToken = await EmailVerification.createVerificationToken(testUser.id, 'verification');
      
      await firstToken.reload();
      expect(firstToken.is_used).toBe(true);
      expect(secondToken.is_used).toBe(false);
    });
  });

  describe('Token Validation', () => {
    let verification: EmailVerification;

    beforeEach(async () => {
      verification = await EmailVerification.createVerificationToken(testUser.id, 'verification');
    });

    describe('findValidToken', () => {
      it('should find valid token', async () => {
        const found = await EmailVerification.findValidToken(verification.token, 'verification');
        expect(found).toBeTruthy();
        expect(found?.id).toBe(verification.id);
      });

      it('should not find used token', async () => {
        await verification.markAsUsed();
        const found = await EmailVerification.findValidToken(verification.token, 'verification');
        expect(found).toBeNull();
      });

      it('should not find expired token', async () => {
        await verification.update({ expires_at: new Date(Date.now() - 1000) });
        const found = await EmailVerification.findValidToken(verification.token, 'verification');
        expect(found).toBeNull();
      });

      it('should not find token with wrong type', async () => {
        const found = await EmailVerification.findValidToken(verification.token, 'password_reset');
        expect(found).toBeNull();
      });
    });

    describe('verifyToken', () => {
      it('should verify valid token', async () => {
        const result = await EmailVerification.verifyToken(verification.token, 'verification');
        expect(result.valid).toBe(true);
        expect(result.verification).toBeTruthy();
        expect(result.user).toBeTruthy();
        expect(result.user?.id).toBe(testUser.id);
      });

      it('should not verify invalid token', async () => {
        const result = await EmailVerification.verifyToken('invalid-token', 'verification');
        expect(result.valid).toBe(false);
        expect(result.verification).toBeUndefined();
        expect(result.user).toBeUndefined();
      });
    });
  });

  describe('Instance Methods', () => {
    let verification: EmailVerification;

    beforeEach(async () => {
      verification = await EmailVerification.createVerificationToken(testUser.id, 'verification');
    });

    describe('markAsUsed', () => {
      it('should mark token as used', async () => {
        await verification.markAsUsed();
        await verification.reload();
        expect(verification.is_used).toBe(true);
      });
    });

    describe('isExpired', () => {
      it('should return false for non-expired token', () => {
        expect(verification.isExpired()).toBe(false);
      });

      it('should return true for expired token', async () => {
        await verification.update({ expires_at: new Date(Date.now() - 1000) });
        await verification.reload();
        expect(verification.isExpired()).toBe(true);
      });
    });

    describe('isValid', () => {
      it('should return true for valid token', () => {
        expect(verification.isValid()).toBe(true);
      });

      it('should return false for used token', async () => {
        await verification.markAsUsed();
        await verification.reload();
        expect(verification.isValid()).toBe(false);
      });

      it('should return false for expired token', async () => {
        await verification.update({ expires_at: new Date(Date.now() - 1000) });
        await verification.reload();
        expect(verification.isValid()).toBe(false);
      });
    });
  });

  describe('Cleanup Methods', () => {
    beforeEach(async () => {
      // Create some test data
      await EmailVerification.createVerificationToken(testUser.id, 'verification');
      const expiredToken = await EmailVerification.createVerificationToken(testUser.id, 'password_reset');
      await expiredToken.update({ expires_at: new Date(Date.now() - 1000) });
      
      const usedToken = await EmailVerification.createVerificationToken(testUser.id, 'verification');
      await usedToken.markAsUsed();
      await usedToken.update({ created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) }); // 8 days ago
    });

    describe('cleanupExpiredTokens', () => {
      it('should remove expired tokens', async () => {
        const initialCount = await EmailVerification.count();
        const removedCount = await EmailVerification.cleanupExpiredTokens();
        const finalCount = await EmailVerification.count();
        
        expect(removedCount).toBeGreaterThan(0);
        expect(finalCount).toBe(initialCount - removedCount);
      });
    });

    describe('cleanupUsedTokens', () => {
      it('should remove old used tokens', async () => {
        const initialCount = await EmailVerification.count();
        const removedCount = await EmailVerification.cleanupUsedTokens(7);
        const finalCount = await EmailVerification.count();
        
        expect(removedCount).toBeGreaterThan(0);
        expect(finalCount).toBe(initialCount - removedCount);
      });
    });
  });

  describe('getUserActiveTokens', () => {
    beforeEach(async () => {
      // Create different types of tokens for different users to avoid conflicts
      const secondUser = await User.create({
        username: 'testuser2',
        email: 'test2@example.com',
        password_hash: 'hashedpassword123',
      });
      
      await EmailVerification.createVerificationToken(testUser.id, 'verification');
      await EmailVerification.createVerificationToken(testUser.id, 'password_reset');
      
      // Create a used token for a different user to avoid invalidating the active ones
      const usedToken = await EmailVerification.createVerificationToken(secondUser.id, 'verification');
      await usedToken.markAsUsed();
    });

    it('should get all active tokens for user', async () => {
      const tokens = await EmailVerification.getUserActiveTokens(testUser.id);
      expect(tokens.length).toBeGreaterThan(0);
      tokens.forEach(token => {
        expect(token.is_used).toBe(false);
        expect(token.isExpired()).toBe(false);
      });
    });

    it('should get active tokens by type', async () => {
      const verificationTokens = await EmailVerification.getUserActiveTokens(testUser.id, 'verification');
      const resetTokens = await EmailVerification.getUserActiveTokens(testUser.id, 'password_reset');
      
      expect(verificationTokens.length).toBeGreaterThan(0);
      expect(resetTokens.length).toBeGreaterThan(0);
      
      verificationTokens.forEach(token => {
        expect(token.type).toBe('verification');
      });
      
      resetTokens.forEach(token => {
        expect(token.type).toBe('password_reset');
      });
    });
  });
});