'use strict';

const { Module } = require('@nestjs/common');
const { ConfigModule } = require('@nestjs/config');

const { DatabaseModule } = require('./database/database.module');
const { AuthModule } = require('./auth/auth.module');
const { UsersModule } = require('./users/users.module');
const { EventsModule } = require('./events/events.module');

/**
 * Root application module.
 *
 * Modules:
 *  - ConfigModule (global):    .env loading + typed access.
 *  - DatabaseModule (global):  Sequelize connection, models, associations.
 *  - AuthModule:               register / login / JWT strategy.
 *  - UsersModule:              user lookups.
 *  - EventsModule:             event CRUD + RSVP + attendees routes.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    EventsModule,
  ],
})
class AppModule {}

module.exports = { AppModule };
