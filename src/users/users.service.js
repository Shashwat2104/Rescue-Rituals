'use strict';

const { Inject, Injectable } = require('@nestjs/common');
const { USER_MODEL } = require('../database/database.module');

/**
 * UsersService — thin façade over the User model for callers that need to
 * look up users without depending on the Sequelize model directly.
 */
@Injectable()
class UsersService {
  constructor(@Inject(USER_MODEL) userModel) {
    this.userModel = userModel;
  }

  findById(id) {
    return this.userModel.findOne({ where: { id } });
  }

  findByEmail(email) {
    return this.userModel.findOne({ where: { email: email.toLowerCase() } });
  }
}

module.exports = { UsersService };
