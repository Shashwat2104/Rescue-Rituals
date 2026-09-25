'use strict';

const { Module } = require('@nestjs/common');
const { UsersService } = require('./users.service');

/**
 * UsersModule — exposes {@link UsersService} for user lookups.
 *
 * No providers for the User model are declared here; DatabaseModule is
 * `@Global()` and already supplies it.
 */
@Module({
  providers: [UsersService],
  exports: [UsersService],
})
class UsersModule {}

module.exports = { UsersModule };
