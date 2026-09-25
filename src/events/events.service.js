'use strict';

const {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} = require('@nestjs/common');
const { col, fn, Op } = require('sequelize');

const {
  EVENT_MODEL,
  RSVP_MODEL,
} = require('../database/database.module');

/**
 * EventsService — owns CRUD logic and ownership / authorization rules for
 * events. The HTTP layer (controller) does no business decisions.
 *
 * Authorization rule:
 *   Only the authenticated user whose id matches `event.createdBy`
 *   can update or delete the event.
 */
@Injectable()
class EventsService {
  constructor(
    @Inject(EVENT_MODEL) eventModel,
    @Inject(RSVP_MODEL) rsvpModel,
  ) {
    this.eventModel = eventModel;
    this.rsvpModel = rsvpModel;
    this.logger = new Logger(EventsService.name);
  }

  /**
   * Create a new event. `createdBy` is always derived from the JWT, never
   * accepted from the request body.
   */
  async create(dto, creatorId) {
    const event = await this.eventModel.create({
      title: dto.title,
      description: dto.description ?? null,
      location: dto.location,
      startDate: dto.startDate,
      endDate: dto.endDate,
      capacity: dto.capacity,
      createdBy: creatorId,
    });
    this.logger.log(`Event created: ${event.id} by user ${creatorId}`);
    return this.toResponseDto(event, 0);
  }

  /**
   * List all events with their current attendee count.
   * Two queries total, regardless of event count: one for events, one for
   * the grouped attendee counts.
   */
  async findAll() {
    const events = await this.eventModel.findAll({
      order: [['startDate', 'ASC']],
    });
    if (events.length === 0) return [];

    const ids = events.map((e) => e.id);
    const grouped = await this.rsvpModel.findAll({
      attributes: ['eventId', [fn('COUNT', col('id')), 'count']],
      where: { eventId: { [Op.in]: ids } },
      group: ['eventId'],
      raw: true,
    });

    const countByEventId = new Map(
      grouped.map((row) => [row.eventId, Number(row.count)]),
    );

    return events.map((event) =>
      this.toResponseDto(event, countByEventId.get(event.id) || 0),
    );
  }

  /**
   * Fetch a single event with its current attendee count.
   */
  async findOne(id) {
    const event = await this.eventModel.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    const attendeeCount = await this.rsvpModel.count({ where: { eventId: id } });
    return this.toResponseDto(event, attendeeCount);
  }

  /**
   * Update an event. Only the owner can do this; other authenticated users get
   * 403. The event must exist (404 otherwise).
   */
  async update(id, dto, requesterId) {
    const event = await this.eventModel.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    this.assertOwnership(event, requesterId);

    const updatable = [
      'title',
      'description',
      'location',
      'startDate',
      'endDate',
      'capacity',
    ];
    for (const field of updatable) {
      if (dto[field] !== undefined) {
        event[field] = dto[field];
      }
    }
    // Defensive re-check after a partial update.
    if (
      new Date(event.endDate).getTime() <= new Date(event.startDate).getTime()
    ) {
      throw new BadRequestException('endDate must be later than startDate');
    }

    const saved = await event.save();
    this.logger.log(`Event updated: ${saved.id} by user ${requesterId}`);
    const attendeeCount = await this.rsvpModel.count({ where: { eventId: id } });
    return this.toResponseDto(saved, attendeeCount);
  }

  /**
   * Delete an event. Only the owner can do this. Cascading FK constraints
   * remove the dependent RSVP rows.
   */
  async remove(id, requesterId) {
    const event = await this.eventModel.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    this.assertOwnership(event, requesterId);
    await event.destroy();
    this.logger.log(`Event deleted: ${id} by user ${requesterId}`);
  }

  assertOwnership(event, requesterId) {
    if (event.createdBy !== requesterId) {
      this.logger.warn(
        `Forbidden event access: user ${requesterId} tried to modify event ${event.id} owned by ${event.createdBy}`,
      );
      throw new ForbiddenException('You are not allowed to modify this event');
    }
  }

  toResponseDto(event, attendeeCount) {
    return {
      id: event.id,
      title: event.title,
      description: event.description ?? null,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
      capacity: event.capacity,
      createdById: event.createdBy,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      attendeeCount: Number(attendeeCount) || 0,
    };
  }
}

module.exports = { EventsService };
