'use strict';

const appointmentStatusValues = [
  'scheduled',
  'completed',
  'cancelled',
  'converted',
  'no_show',
  'confirmed',
  'rescheduled',
];

const eventStatusValues = [
  'draft',
  'designing',
  'quotation_pending',
  'quoted',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
];

const quotationStatusValues = [
  'draft',
  'sent',
  'approved',
  'rejected',
  'expired',
  'superseded',
  'converted_to_contract',
];

const contractStatusValues = [
  'draft',
  'issued',
  'signed',
  'active',
  'completed',
  'cancelled',
  'terminated',
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('appointments', 'status', {
      type: Sequelize.ENUM(...appointmentStatusValues),
      allowNull: false,
      defaultValue: 'scheduled',
    });

    await queryInterface.changeColumn('events', 'status', {
      type: Sequelize.ENUM(...eventStatusValues),
      allowNull: false,
      defaultValue: 'draft',
    });

    await queryInterface.changeColumn('quotations', 'status', {
      type: Sequelize.ENUM(...quotationStatusValues),
      allowNull: false,
      defaultValue: 'draft',
    });

    await queryInterface.changeColumn('contracts', 'status', {
      type: Sequelize.ENUM(...contractStatusValues),
      allowNull: false,
      defaultValue: 'draft',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('contracts', 'status', {
      type: Sequelize.ENUM(
        'draft',
        'active',
        'completed',
        'cancelled',
        'terminated',
      ),
      allowNull: false,
      defaultValue: 'draft',
    });

    await queryInterface.changeColumn('quotations', 'status', {
      type: Sequelize.ENUM(
        'draft',
        'sent',
        'approved',
        'rejected',
        'expired',
        'converted_to_contract',
      ),
      allowNull: false,
      defaultValue: 'draft',
    });

    await queryInterface.changeColumn('events', 'status', {
      type: Sequelize.ENUM(
        'draft',
        'designing',
        'confirmed',
        'in_progress',
        'completed',
        'cancelled',
      ),
      allowNull: false,
      defaultValue: 'draft',
    });

    await queryInterface.changeColumn('appointments', 'status', {
      type: Sequelize.ENUM(
        'scheduled',
        'confirmed',
        'completed',
        'rescheduled',
        'cancelled',
        'no_show',
      ),
      allowNull: false,
      defaultValue: 'scheduled',
    });
  },
};
