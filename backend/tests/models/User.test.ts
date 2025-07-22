import User from '../../src/models/User';
import { sequelize } from '../../src/config/database';

describe('User Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await User.destroy({ where: {}, force: true });
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123',
      };

      const user = await User.create(userData);

      expect(user.id).toBeDefined();
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.is_verified).toBe(false);
      expect(user.is_admin).toBe(false);
      expect(user.is_active).toBe(true);
      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.updated_at).toBeInstanceOf(Date);
    });

    it('should hash password before creating user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'plainpassword123',
      };

      const user = await User.create(userData);
      expect(user.password_hash).not.toBe(userData.password_hash);
      expect(user.password_hash.length).toBeGreaterThan(50);
    });

    it('should not allow duplicate username', async () => {
      const userData = {
        username: 'testuser',
        email: 'test1@example.com',
        password_hash: 'password123',
      };

      await User.create(userData);

      const duplicateUserData = {
        username: 'testuser',
        email: 'test2@example.com',
        password_hash: 'password456',
      };

      await expect(User.create(duplicateUserData)).rejects.toThrow();
    });

    it('should not allow duplicate email', async () => {
      const userData = {
        username: 'testuser1',
        email: 'test@example.com',
        password_hash: 'password123',
      };

      await User.create(userData);

      const duplicateUserData = {
        username: 'testuser2',
        email: 'test@example.com',
        password_hash: 'password456',
      };

      await expect(User.create(duplicateUserData)).rejects.toThrow();
    });
  });

  describe('User Validation', () => {
    it('should validate username length', async () => {
      const userData = {
        username: 'ab', // Too short
        email: 'test@example.com',
        password_hash: 'password123',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password_hash: 'password123',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should validate avatar URL format', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'password123',
        avatar_url: 'invalid-url',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('User Methods', () => {
    let user: User;

    beforeEach(async () => {
      user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'password123',
      });
    });

    describe('validatePassword', () => {
      it('should validate correct password', async () => {
        const isValid = await user.validatePassword('password123');
        expect(isValid).toBe(true);
      });

      it('should reject incorrect password', async () => {
        const isValid = await user.validatePassword('wrongpassword');
        expect(isValid).toBe(false);
      });
    });

    describe('toSafeJSON', () => {
      it('should return user data without password hash', () => {
        const safeUser = user.toSafeJSON();
        expect(safeUser).not.toHaveProperty('password_hash');
        expect(safeUser).toHaveProperty('id');
        expect(safeUser).toHaveProperty('username');
        expect(safeUser).toHaveProperty('email');
      });
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'password123',
      });
    });

    describe('findByEmail', () => {
      it('should find user by email', async () => {
        const user = await User.findByEmail('test@example.com');
        expect(user).toBeTruthy();
        expect(user?.email).toBe('test@example.com');
      });

      it('should return null for non-existent email', async () => {
        const user = await User.findByEmail('nonexistent@example.com');
        expect(user).toBeNull();
      });
    });

    describe('findByUsername', () => {
      it('should find user by username', async () => {
        const user = await User.findByUsername('testuser');
        expect(user).toBeTruthy();
        expect(user?.username).toBe('testuser');
      });

      it('should return null for non-existent username', async () => {
        const user = await User.findByUsername('nonexistent');
        expect(user).toBeNull();
      });
    });

    describe('hashPassword', () => {
      it('should hash password securely', async () => {
        const password = 'testpassword123';
        const hash = await User.hashPassword(password);
        
        expect(hash).not.toBe(password);
        expect(hash.length).toBeGreaterThan(50);
        expect(hash.startsWith('$2b$')).toBe(true);
      });
    });
  });
});