'use strict';

const { ApiProperty } = require('@nestjs/swagger');
const { IsEmail, IsString, MaxLength, MinLength } = require('class-validator');

/**
 * Payload accepted by `POST /auth/login`.
 */
class LoginDto {
  @ApiProperty({
    type: 'string',
    format: 'email',
    description: 'Email address of the registered user.',
    example: 'ada@example.com',
  })
  @IsEmail()
  @MaxLength(255)
  email;

  @ApiProperty({
    type: 'string',
    description: 'User password (plain text; never stored as plain text).',
    example: 'strongP@ssw0rd',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password;
}

module.exports = { LoginDto };
