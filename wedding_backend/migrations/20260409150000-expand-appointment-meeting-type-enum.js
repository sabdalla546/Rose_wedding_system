'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE appointments
      SET meetingType = 'Office Visit 1'
      WHERE meetingType = 'Office Visit';
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE appointments
      MODIFY COLUMN meetingType ENUM(
        'New Appointment 1',
        'New Appointment 2',
        'New Appointment 3',
        'Details Appointment 1',
        'Details Appointment 2',
        'Details Appointment 3',
        'Office Visit 1',
        'Office Visit 2',
        'Office Visit 3'
      ) NOT NULL DEFAULT 'Office Visit 1';
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE appointments
      SET meetingType = 'Office Visit'
      WHERE meetingType IN ('Office Visit 1', 'Office Visit 2', 'Office Visit 3');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE appointments
      MODIFY COLUMN meetingType ENUM(
        'New Appointment 1',
        'New Appointment 2',
        'New Appointment 3',
        'Details Appointment 1',
        'Details Appointment 2',
        'Details Appointment 3',
        'Office Visit'
      ) NOT NULL DEFAULT 'Office Visit';
    `);
  },
};
