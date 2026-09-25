'use strict';

const { ApiProperty } = require('@nestjs/swagger');

/**
 * Public projection of a User. Never contains passwordHash.
 */
class UserResponseDto {
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'Unique identifier of the user.',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  id;

  @ApiProperty({
    type: 'string',
    description: 'Display name of the user.',
    example: 'Ada Lovelace',
  })
  name;

  @ApiProperty({
    type: 'string',
    format: 'email',
    description: 'User\'s registered email address.',
    example: 'ada@example.com',
  })
  email;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'When the user account was created.',
    example: '2025-04-01T12:00:00.000Z',
  })
  createdAt;
}

/**
 * Response returned by `POST /auth/register` and `POST /auth/login`.
 */
class AuthResponseDto {
  @ApiProperty({
    type: 'string',
    description:
      'JWT bearer token. Send in `Authorization: Bearer <token>` for protected routes.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken;

  @ApiProperty({ type: () => UserResponseDto })
  user;
}

module.exports = { AuthResponseDto, UserResponseDto };
