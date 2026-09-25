'use strict';

const { EventsService } = require('./events.service');
const {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} = require('@nestjs/common');

function makeModel(overrides = {}) {
  const base = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  };
  return Object.assign(base, overrides);
}

describe('EventsService', () => {
  let eventModel;
  let rsvpModel;
  let service;

  beforeEach(() => {
    eventModel = makeModel();
    rsvpModel = makeModel();
    service = new EventsService(eventModel, rsvpModel);
  });

  describe('create', () => {
    it('creates an event and tags it with the authenticated creator', async () => {
      const savedEvent = {
        id: 'evt-1',
        title: 'Launch',
        description: null,
        location: 'Online',
        startDate: new Date('2030-01-01T10:00:00Z'),
        endDate: new Date('2030-01-01T11:00:00Z'),
        capacity: 100,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      eventModel.create.mockResolvedValue(savedEvent);

      const result = await service.create(
        {
          title: 'Launch',
          location: 'Online',
          startDate: new Date('2030-01-01T10:00:00Z'),
          endDate: new Date('2030-01-01T11:00:00Z'),
          capacity: 100,
        },
        'user-1',
      );

      expect(eventModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 'user-1' }),
      );
      expect(result.attendeeCount).toBe(0);
      expect(result.createdById).toBe('user-1');
      expect(result.id).toBe('evt-1');
    });

    it('does not accept a createdBy from the dto', async () => {
      eventModel.create.mockImplementation(async (data) => ({ id: 'evt-x', ...data }));

      await service.create(
        {
          title: 'Launch',
          location: 'Online',
          startDate: new Date('2030-01-01T10:00:00Z'),
          endDate: new Date('2030-01-01T11:00:00Z'),
          capacity: 100,
          createdBy: 'attacker-id', // attempted injection
        },
        'real-user',
      );

      const passed = eventModel.create.mock.calls[0][0];
      expect(passed.createdBy).toBe('real-user');
    });
  });

  describe('findAll', () => {
    it('returns events with attendee counts', async () => {
      eventModel.findAll.mockResolvedValue([
        { id: 'evt-1', capacity: 10, createdBy: 'u1' },
        { id: 'evt-2', capacity: 5, createdBy: 'u2' },
      ]);
      rsvpModel.findAll.mockResolvedValue([
        { eventId: 'evt-1', count: '7' },
        { eventId: 'evt-2', count: '5' },
      ]);

      const result = await service.findAll();
      const evt1 = result.find((e) => e.id === 'evt-1');
      const evt2 = result.find((e) => e.id === 'evt-2');
      expect(evt1.attendeeCount).toBe(7);
      expect(evt2.attendeeCount).toBe(5);
    });
  });

  describe('findOne', () => {
    it('returns the event with attendee count', async () => {
      eventModel.findOne.mockResolvedValue({ id: 'evt-1', capacity: 10, createdBy: 'u1' });
      rsvpModel.count.mockResolvedValue(3);

      const result = await service.findOne('evt-1');
      expect(result.id).toBe('evt-1');
      expect(result.attendeeCount).toBe(3);
    });

    it('throws 404 when the event does not exist', async () => {
      eventModel.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update ownership', () => {
    it('allows the owner to update their own event', async () => {
      const event = {
        id: 'evt-1',
        createdBy: 'user-1',
        title: 'Old',
        description: null,
        location: 'X',
        startDate: new Date('2030-01-01T10:00:00Z'),
        endDate: new Date('2030-01-01T11:00:00Z'),
        capacity: 10,
        save: jest.fn(async function save() { return this; }),
      };
      eventModel.findOne.mockResolvedValue(event);

      await service.update('evt-1', { title: 'New' }, 'user-1');
      expect(event.save).toHaveBeenCalled();
      expect(event.title).toBe('New');
    });

    it('rejects other authenticated users with 403', async () => {
      eventModel.findOne.mockResolvedValue({
        id: 'evt-1',
        createdBy: 'user-1',
        title: 'Old',
        description: null,
        location: 'X',
        startDate: new Date('2030-01-01T10:00:00Z'),
        endDate: new Date('2030-01-01T11:00:00Z'),
        capacity: 10,
        save: jest.fn(),
      });

      await expect(
        service.update('evt-1', { title: 'New' }, 'user-2'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws 404 when the event does not exist', async () => {
      eventModel.findOne.mockResolvedValue(null);
      await expect(
        service.update('missing', { title: 'x' }, 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects an endDate that becomes <= startDate', async () => {
      const event = {
        id: 'evt-1',
        createdBy: 'user-1',
        title: 'Old',
        description: null,
        location: 'X',
        startDate: new Date('2030-01-01T10:00:00Z'),
        endDate: new Date('2030-01-01T11:00:00Z'),
        capacity: 10,
        save: jest.fn(),
      };
      eventModel.findOne.mockResolvedValue(event);

      await expect(
        service.update(
          'evt-1',
          { endDate: new Date('2029-01-01T00:00:00Z') },
          'user-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('remove ownership', () => {
    it('allows the owner to delete', async () => {
      const event = {
        id: 'evt-1',
        createdBy: 'user-1',
        destroy: jest.fn(),
      };
      eventModel.findOne.mockResolvedValue(event);
      await service.remove('evt-1', 'user-1');
      expect(event.destroy).toHaveBeenCalled();
    });

    it('rejects other authenticated users with 403', async () => {
      eventModel.findOne.mockResolvedValue({
        id: 'evt-1',
        createdBy: 'user-1',
        destroy: jest.fn(),
      });
      await expect(service.remove('evt-1', 'user-2')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws 404 when the event does not exist', async () => {
      eventModel.findOne.mockResolvedValue(null);
      await expect(service.remove('missing', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
