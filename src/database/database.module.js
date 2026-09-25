'use strict';

const { Global, Module, Logger } = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const { Sequelize } = require('sequelize');

const { initUser } = require('./models/user.model');
const { initEvent } = require('./models/event.model');
const { initRsvp } = require('./models/rsvp.model');

/**
 * Injection tokens used to fetch the Sequelize connection and the model classes
 * from the Nest DI container.
 *
 * Symbols are used to avoid accidental name collisions.
 */
const SEQUELIZE = Symbol('SEQUELIZE');
const USER_MODEL = Symbol('USER_MODEL');
const EVENT_MODEL = Symbol('EVENT_MODEL');
const RSVP_MODEL = Symbol('RSVP_MODEL');

/**
 * DatabaseModule is marked `@Global()` so the Sequelize connection and models
 * are available to every feature module without re-importing the providers.
 *
 * Associations are wired once at provider construction time and the connection
 * is verified eagerly so a misconfigured environment fails fast at boot.
 */
const sequelizeProvider = {
  provide: SEQUELIZE,
  inject: [ConfigService],
  useFactory: (config) => {
    const logger = new Logger('DatabaseModule');
    const host = config.get('DATABASE_HOST');
    const port = Number(config.get('DATABASE_PORT'));
    const database = config.get('DATABASE_NAME');
    const username = config.get('DATABASE_USER');
    const password = config.get('DATABASE_PASSWORD');

    if (!host) throw new Error('DATABASE_HOST env variable is required');
    if (!port) throw new Error('DATABASE_PORT env variable is required');
    if (!database) throw new Error('DATABASE_NAME env variable is required');
    if (!username) throw new Error('DATABASE_USER env variable is required');
    if (!password) throw new Error('DATABASE_PASSWORD env variable is required');

    const sequelize = new Sequelize({
      dialect: 'postgres',
      host,
      port,
      database,
      username,
      password,
      logging:
        config.get('DATABASE_LOGGING') === 'true' ? console.log : false,
      define: {
        freezeTableName: true,
      },
    });
    logger.log(
      `Sequelize initialised for ${database} on ${host}:${port}`,
    );
    return sequelize;
  },
};

const modelsProvider = {
  provide: 'MODELS',
  inject: [SEQUELIZE],
  useFactory: (sequelize) => {
    const User = initUser(sequelize);
    const Event = initEvent(sequelize);
    const Rsvp = initRsvp(sequelize);

    // --- Associations -----------------------------------------------------
    // User 1 ─── * Event
    User.hasMany(Event, {
      foreignKey: 'createdBy',
      as: 'events',
      onDelete: 'CASCADE',
    });
    Event.belongsTo(User, {
      foreignKey: 'createdBy',
      as: 'createdByUser',
    });

    // User 1 ─── * RSVP
    User.hasMany(Rsvp, {
      foreignKey: 'userId',
      as: 'rsvps',
      onDelete: 'CASCADE',
    });
    Rsvp.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user',
    });

    // Event 1 ─── * RSVP
    Event.hasMany(Rsvp, {
      foreignKey: 'eventId',
      as: 'rsvps',
      onDelete: 'CASCADE',
    });
    Rsvp.belongsTo(Event, {
      foreignKey: 'eventId',
      as: 'event',
    });

    return Object.freeze({ User, Event, Rsvp });
  },
};

const userModelProvider = {
  provide: USER_MODEL,
  inject: ['MODELS'],
  useFactory: (models) => models.User,
};

const eventModelProvider = {
  provide: EVENT_MODEL,
  inject: ['MODELS'],
  useFactory: (models) => models.Event,
};

const rsvpModelProvider = {
  provide: RSVP_MODEL,
  inject: ['MODELS'],
  useFactory: (models) => models.Rsvp,
};

@Global()
@Module({
  providers: [
    sequelizeProvider,
    modelsProvider,
    userModelProvider,
    eventModelProvider,
    rsvpModelProvider,
  ],
  exports: [SEQUELIZE, USER_MODEL, EVENT_MODEL, RSVP_MODEL],
})
class DatabaseModule {}

module.exports = {
  DatabaseModule,
  SEQUELIZE,
  USER_MODEL,
  EVENT_MODEL,
  RSVP_MODEL,
};
