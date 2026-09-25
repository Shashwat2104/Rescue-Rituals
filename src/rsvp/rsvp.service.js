'use strict';

const {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} = require('@nestjs/common');

const {
  EVENT_MODEL,
  RSVP_MODEL,
  SEQUELIZE,
  USER_MODEL,
} = require('../database/database.module');

/**
 * RsvpService — owns the RSVP / attendee business rules.
 *
 * Concurrency strategy
 * --------------------
 * The naive "count then insert" pattern can exceed capacity under concurrent
 * requests. We avoid that with a Postgres row-level lock:
 *
 *   BEGIN
 *     SELECT ... FROM events WHERE id = :id FOR UPDATE   -- serializes the slot
 *     SELECT COUNT(*) FROM rsvps WHERE event_id = :id    -- under the lock
 *     INSERT INTO rsvps (...) VALUES (...)
 *   COMMIT
 *
 * The DB UNIQUE constraint on (event_id, user_id) is the final guard against
 * duplicate RSVPs if any pre-check is somehow bypassed.
 */
@Injectable()
class RsvpService {
  constructor(
    @Inject(SEQUELIZE) sequelize,
    @Inject(EVENT_MODEL) eventModel,
    @Inject(RSVP_MODEL) rsvpModel,
    @Inject(USER_MODEL) userModel,
  ) {
    this.sequelize = sequelize;
    this.eventModel = eventModel;
    this.rsvpModel = rsvpModel;
    this.userModel = userModel;
    this.logger = new Logger(RsvpService.name);
  }

  /**
   * Authenticated user joins an event.
   * Throws:
   *  - NotFoundException if the event doesn't exist (404)
   *  - ConflictException on duplicate RSVP or full event (409)
   */
  async rsvpToEvent(eventId, userId) {
    const transaction = await this.sequelize.transaction();
    try {
      // 1) Lock the event row so concurrent RSVPs serialize on this slot.
      const event = await this.eventModel.findByPk(eventId, {
        transaction,
        lock: transaction.LOCK?.UPDATE ?? 'UPDATE',
      });
      if (!event) {
        await transaction.rollback();
        throw new NotFoundException('Event not found');
      }

      // 2) Pre-check for a duplicate (still useful for clean errors and
      //    saving a needless INSERT).
      const existing = await this.rsvpModel.findOne({
        where: { eventId, userId },
        transaction,
      });
      if (existing) {
        await transaction.rollback();
        throw new ConflictException('You have already RSVP\'d to this event');
      }

      // 3) Capacity check, performed under the row lock.
      const currentAttendees = await this.rsvpModel.count({
        where: { eventId },
        transaction,
      });
      if (currentAttendees >= event.capacity) {
        await transaction.rollback();
        throw new ConflictException('Event is at capacity');
      }

      // 4) Insert the RSVP. The DB UNIQUE constraint will reject any duplicate
      //    that somehow slipped through.
      let rsvp;
      try {
        rsvp = await this.rsvpModel.create(
          { eventId, userId },
          { transaction },
        );
      } catch (err) {
        await transaction.rollback();
        if (err && err.name === 'SequelizeUniqueConstraintError') {
          throw new ConflictException('You have already RSVP\'d to this event');
        }
        throw err;
      }

      await transaction.commit();
      this.logger.log(`RSVP created: user=${userId} event=${eventId}`);
      return {
        id: rsvp.id,
        eventId: rsvp.eventId,
        userId: rsvp.userId,
        createdAt: rsvp.createdAt,
      };
    } catch (err) {
      // Only rollback if the transaction hasn't already been finalised.
      try {
        await transaction.rollback();
      } catch (_) {
        /* already rolled back */
      }
      throw err;
    }
  }

  /**
   * List the attendees for an event.
   * Returns id / name / email only. Never password or passwordHash.
   */
  async listAttendees(eventId) {
    const event = await this.eventModel.findByPk(eventId, {
      attributes: ['id', 'capacity'],
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const rsvps = await this.rsvpModel.findAll({
      where: { eventId },
      include: [
        {
          model: this.userModel,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    const items = rsvps
      .filter((r) => r.user) // skip if user was deleted concurrently
      .map((r) => ({
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
      }));

    return {
      items,
      count: items.length,
      capacity: event.capacity,
    };
  }
}

module.exports = { RsvpService };
