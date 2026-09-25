'use strict';

const { Module } = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const { JwtModule } = require('@nestjs/jwt');
const { PassportModule } = require('@nestjs/passport');

const { AuthController } = require('./auth.controller');
const { AuthService } = require('./auth.service');
const { JwtStrategy } = require('./strategies/jwt.strategy');

/**
 * AuthModule — exposes the public registration / login endpoints, configures
 * Passport + JWT and registers {@link JwtStrategy}.
 *
 * Does NOT import DatabaseModule: it is `@Global()`, so the model + Sequelize
 * providers are already available in the DI container.
 */
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config) => {
        const secret = config.get('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not configured');
        }
        return {
          secret,
          signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '1h') },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
class AuthModule {}

module.exports = { AuthModule };
