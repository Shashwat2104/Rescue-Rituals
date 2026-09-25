'use strict';

const { createParamDecorator } = require('@nestjs/common');

/**
 * Parameter decorator that extracts the authenticated user (as set by the
 * JWT strategy) from the current request.
 *
 * Usage:
 *   createEvent(@Body() dto, @CurrentUser() user) { ... }
 */
const CurrentUser = createParamDecorator((_data, ctx) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});

module.exports = { CurrentUser };
