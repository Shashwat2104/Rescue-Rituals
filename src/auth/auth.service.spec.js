'use strict';

const bcrypt = require('bcrypt');
const { AuthService } = require('./auth.service');
const {
  ConflictException,
  UnauthorizedException,
} = require('@nestjs/common');

describe('AuthService', () => {
  let userModel;
  let jwtService;
  let configService;
  let service;

  beforeEach(() => {
    userModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    jwtService = { sign: jest.fn(() => 'signed-jwt-token') };
    configService = {
      get: jest.fn((key, fallback) => {
        if (key === 'BCRYPT_SALT_ROUNDS') return 4; // fast for tests
        if (key === 'JWT_SECRET') return 'test-secret';
        return fallback;
      }),
    };
    service = new AuthService(userModel, jwtService, configService);
  });

  describe('register', () => {
    it('creates a user, hashes the password and returns a JWT', async () => {
      userModel.findOne.mockResolvedValue(null);
      const createdUser = {
        id: 'user-1',
        name: 'Ada',
        email: 'ada@example.com',
        createdAt: new Date('2025-01-01'),
      };
      userModel.create.mockResolvedValue(createdUser);

      const dto = {
        name: 'Ada',
        email: 'Ada@Example.com',
        password: 'strongP@ssw0rd',
      };

      const result = await service.register(dto);

      expect(userModel.findOne).toHaveBeenCalledWith({
        where: { email: 'ada@example.com' },
      });
      expect(userModel.create).toHaveBeenCalledTimes(1);
      const created = userModel.create.mock.calls[0][0];
      expect(created.email).toBe('ada@example.com');
      expect(created.name).toBe('Ada');
      expect(created.passwordHash).not.toBe(dto.password);
      const matches = await bcrypt.compare(dto.password, created.passwordHash);
      expect(matches).toBe(true);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'ada@example.com',
      });
      expect(result.accessToken).toBe('signed-jwt-token');
      expect(result.user).toEqual(createdUser);
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('rejects a duplicate email with 409', async () => {
      userModel.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({ name: 'Ada', email: 'ada@example.com', password: 'whatever8chars' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(userModel.create).not.toHaveBeenCalled();
    });

    it('maps a SequelizeUniqueConstraintError into 409', async () => {
      userModel.findOne.mockResolvedValue(null);
      const uniqueErr = new Error('duplicate');
      uniqueErr.name = 'SequelizeUniqueConstraintError';
      userModel.create.mockRejectedValue(uniqueErr);

      await expect(
        service.register({ name: 'Ada', email: 'ada@example.com', password: 'whatever8chars' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('does not return passwordHash in the response', async () => {
      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockResolvedValue({
        id: 'user-1',
        name: 'Ada',
        email: 'ada@example.com',
        createdAt: new Date(),
        passwordHash: 'super-secret-hash',
      });

      const result = await service.register({
        name: 'Ada',
        email: 'ada@example.com',
        password: 'whatever8chars',
      });

      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('login', () => {
    it('returns a JWT for valid credentials', async () => {
      const hash = await bcrypt.hash('correct-password', 4);
      userModel.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'ada@example.com',
        passwordHash: hash,
        name: 'Ada',
        createdAt: new Date(),
      });

      const result = await service.login({
        email: 'ada@example.com',
        password: 'correct-password',
      });

      expect(result.accessToken).toBe('signed-jwt-token');
      expect(result.user.id).toBe('user-1');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('throws Unauthorized when the email is unknown', async () => {
      userModel.findOne.mockResolvedValue(null);
      await expect(
        service.login({ email: 'noone@example.com', password: 'whatever8chars' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws Unauthorized when the password is wrong', async () => {
      const hash = await bcrypt.hash('correct-password', 4);
      userModel.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'ada@example.com',
        passwordHash: hash,
        name: 'Ada',
      });

      await expect(
        service.login({ email: 'ada@example.com', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('normalises email casing before lookup', async () => {
      userModel.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'ada@example.com',
        passwordHash: await bcrypt.hash('correct-password', 4),
      });

      await service.login({ email: 'ADA@example.com', password: 'correct-password' });
      expect(userModel.findOne).toHaveBeenCalledWith({
        where: { email: 'ada@example.com' },
      });
    });
  });
});
