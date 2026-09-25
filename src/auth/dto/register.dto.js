'use strict';

const { ApiProperty } = require('@nestjs/swagger');
const { IsEmail, IsString, MaxLength, MinLength } = require('class-validator');

/**
 * Payload accepted by `POST /auth/register`.
 */
class RegisterDto {
  @ApiProperty({ type: 'string', example: 'Ada Lovelace', minLength: 2, maxLength: 120 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name;

  @ApiProperty({ type: 'string', example: 'ada@example.com', format: 'email', maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  email;

  @ApiProperty({ type: 'string', example: 'strongP@ssw0rd', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password;
}

module.exports = { RegisterDto };
