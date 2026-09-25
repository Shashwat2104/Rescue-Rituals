'use strict';

const { Inject, Injectable } = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const { PassportStrategy } = require('@nestjs/passport');
const { ExtractJwt, Strategy } = require('passport-jwt');

/**
 * JWT strategy used by Passport to validate incoming bearer tokens.
 *
 * The `validate` method returns an object that Nest exposes as `request.user`
 * and that the {@link CurrentUser} parameter decorator forwards to controllers.
 */
@Injectable()
class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(ConfigService) config) {
    const secret = config.get('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload) {
    // payload.sub is the user id (set by AuthService#login/register)
    return { id: payload.sub, email: payload.email };
  }
}

module.exports = { JwtStrategy };
