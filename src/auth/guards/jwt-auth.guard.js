'use strict';

const { Injectable } = require('@nestjs/common');
const { AuthGuard } = require('@nestjs/passport');

/**
 * Reusable JWT guard. Use it with `@UseGuards(JwtAuthGuard)` on protected routes.
 *
 * Missing / malformed / expired tokens result in `401 Unauthorized`.
 *
 * NOTE: `@Injectable()` is required here — without it SWC/Babel does not emit
 * the DI metadata that NestJS needs to register the provider, which can cause
 * "Nest could not resolve dependencies of JwtAuthGuard" in some configurations.
 */
@Injectable()
class JwtAuthGuard extends AuthGuard('jwt') {}

module.exports = { JwtAuthGuard };
