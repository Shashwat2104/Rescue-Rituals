'use strict';

const { RsvpService } = require('./rsvp.service');
const {
  ConflictException,
  NotFoundException,
} = require('@nestjs/common');

function createMockTransaction() {
  return {
    LOCK: { UPDATE: 'UPDATE' },
    commit: jest.fn(async () => undefined),
    rollback: jest.fn(async () => undefined),
  };
}

describe('RsvpService', () => {
  let sequelize;
  let eventModel;
  let rsvpModel;
  let userModel;
  let service;
  let transaction;

  beforeEach(() => {
    transaction = createMockTransaction();
    sequelize = {
      transaction: jest.fn(async () => transaction),
    };
    eventModel = {
      findByPk: jest.fn(),
    };
    rsvpModel = {
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
    };
    userModel = {};
    service = new RsvpService(sequelize, eventModel, rsvpModel, userModel);
  });

  describe('rsvpToEvent', () => {
    it('creates an RSVP when the event has spare capacity and the user has not RSVPd', async () => {
      eventModel.findByPk.mockResolvedValue({ id: 'evt-1', capacity: 3 });
      rsvpModel.findOne.mockResolvedValue(null);
      rsvpModel.count.mockResolvedValue(1); // 1 of 3 slots used
      rsvpModel.create.mockResolvedValue({
        id: 'rsvp-1',
        eventId: 'evt-1',
        userId: 'user-1',
        createdAt: new Date(),
      });

      const result = await service.rsvpToEvent('evt-1', 'user-1');

      expect(eventModel.findByPk).toHaveBeenCalledWith('evt-1', {
        transaction,
        lock: 'UPDATE',
      });
      expect(rsvpModel.create).toHaveBeenCalledWith(
        { eventId: 'evt-1', userId: 'user-1' },
        { transaction },
      );
      expect(transaction.commit).toHaveBeenCalled();
      expect(result.eventId).toBe('evt-1');
      expect(result.userId).toBe('user-1');
    });

    it('rejects when the event does not exist', async () => {
      eventModel.findByPk.mockResolvedValue(null);

      await expect(service.rsvpToEvent('missing', 'user-1'))
        .rejects.toBeInstanceOf(NotFoundException);
      expect(transaction.commit).not.toHaveBeenCalled();
      expect(rsvpModel.create).not.toHaveBeenCalled();
    });

    it('rejects a duplicate RSVP from the same user', async () => {
      eventModel.findByPk.mockResolvedValue({ id: 'evt-1', capacity: 5 });
      rsvpModel.findOne.mockResolvedValue({ id: 'rsvp-existing' });

      await expect(service.rsvpToEvent('evt-1', 'user-1'))
        .rejects.toBeInstanceOf(ConflictException);
      expect(rsvpModel.create).not.toHaveBeenCalled();
      expect(transaction.commit).not.toHaveBeenCalled();
    });

    it('rejects when the event is at capacity', async () => {
      eventModel.findByPk.mockResolvedValue({ id: 'evt-1', capacity: 2 });
      rsvpModel.findOne.mockResolvedValue(null);
      rsvpModel.count.mockResolvedValue(2); // full

      await expect(service.rsvpToEvent('evt-1', 'user-1'))
        .rejects.toBeInstanceOf(ConflictException);
      expect(rsvpModel.create).not.toHaveBeenCalled();
      expect(transaction.commit).not.toHaveBeenCalled();
    });

    it('maps a Sequelize UNIQUE violation into a 409', async () => {
      eventModel.findByPk.mockResolvedValue({ id: 'evt-1', capacity: 5 });
      rsvpModel.findOne.mockResolvedValue(null);
      rsvpModel.count.mockResolvedValue(0);
      const uniqueErr = new Error('duplicate');
      uniqueErr.name = 'SequelizeUniqueConstraintError';
      rsvpModel.create.mockRejectedValue(uniqueErr);

      await expect(service.rsvpToEvent('evt-1', 'user-1'))
        .rejects.toBeInstanceOf(ConflictException);
      expect(transaction.commit).not.toHaveBeenCalled();
    });

    it('rolls back the transaction when creation fails for any other reason', async () => {
      eventModel.findByPk.mockResolvedValue({ id: 'evt-1', capacity: 5 });
      rsvpModel.findOne.mockResolvedValue(null);
      rsvpModel.count.mockResolvedValue(0);
      rsvpModel.create.mockRejectedValue(new Error('database is down'));

      await expect(service.rsvpToEvent('evt-1', 'user-1'))
        .rejects.toThrow('database is down');
      expect(transaction.commit).not.toHaveBeenCalled();
      // rollback should have been called at least once
      expect(transaction.rollback).toHaveBeenCalled();
    });
  });

  describe('listAttendees', () => {
    it('returns only safe user fields and includes capacity', async () => {
      eventModel.findByPk.mockResolvedValue({ id: 'evt-1', capacity: 3 });
      rsvpModel.findAll.mockResolvedValue([
        {
          id: 'rsvp-1',
          eventId: 'evt-1',
          user: { id: 'user-1', name: 'Ada', email: 'ada@example.com' },
        },
        {
          id: 'rsvp-2',
          eventId: 'evt-1',
          user: { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
        },
      ]);

      const result = await service.listAttendees('evt-1');
      expect(result.items).toEqual([
        { id: 'user-1', name: 'Ada', email: 'ada@example.com' },
        { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
      ]);
      expect(result.count).toBe(2);
      expect(result.capacity).toBe(3);
      // Never expose passwordHash on items
      expect(result.items[0]).not.toHaveProperty('passwordHash');
    });

    it('throws 404 when the event does not exist', async () => {
      eventModel.findByPk.mockResolvedValue(null);
      await expect(service.listAttendees('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
