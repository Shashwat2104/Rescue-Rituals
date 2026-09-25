'use strict';

const {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const { JwtService } = require('@nestjs/jwt');
const bcrypt = require('bcrypt');

const { USER_MODEL } = require('../database/database.module');

/**
 * AuthService — owns registration, login and password hashing concerns.
 *
 * It never returns `passwordHash` to callers and never logs passwords, tokens
 * or hashes.
 *
 * Every constructor parameter carries an explicit `@Inject()` so the Nest
 * container can resolve it without relying on TS-emitted parameter metadata,
 * which the JavaScript / SWC toolchain does not always populate consistently
 * for externally-imported classes.
 */
@Injectable()
class AuthService {
  constructor(
    @Inject(USER_MODEL) userModel,
    @Inject(JwtService) jwtService,
    @Inject(ConfigService) config,
  ) {
    this.userModel = userModel;
    this.jwtService = jwtService;
    this.config = config;
    this.logger = new Logger(AuthService.name);
  }

  async register(dto) {
    const normalisedEmail = dto.email.toLowerCase();

    const existing = await this.userModel.findOne({
      where: { email: normalisedEmail },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await this.hashPassword(dto.password);

    let user;
    try {
      user = await this.userModel.create({
        name: dto.name,
        email: normalisedEmail,
        passwordHash,
      });
    } catch (err) {
      // Race condition: another request registered the same email between
      // our pre-check and the insert. The DB UNIQUE constraint caught it.
      if (err && err.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictException('Email is already registered');
      }
      this.logger.error('Failed to register user', err.stack || String(err));
      throw err;
    }

    this.logger.log(`User registered: ${user.id} (${user.email})`);
    return this.buildAuthResponse(user);
  }

  async login(dto) {
    const normalisedEmail = dto.email.toLowerCase();

    const user = await this.userModel.findOne({
      where: { email: normalisedEmail },
    });
    if (!user) {
      // Don't disclose whether the email exists.
      this.logger.warn(`Login failed: unknown email ${normalisedEmail}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      this.logger.warn(`Login failed: bad password for ${normalisedEmail}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.log(`User logged in: ${user.id} (${user.email})`);
    return this.buildAuthResponse(user);
  }

  async hashPassword(plain) {
    const saltRounds = Number(this.config.get('BCRYPT_SALT_ROUNDS')) || 10;
    return bcrypt.hash(plain, saltRounds);
  }

  buildAuthResponse(user) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: this.toSafeUser(user),
    };
  }

  /**
   * Strip the passwordHash before sending a User instance to a client.
   * We construct an explicit shape so future fields don't accidentally leak.
   */
  toSafeUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}

module.exports = { AuthService };
