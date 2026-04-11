'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('customers', 'source', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    await queryInterface.addColumn('customers', 'sourceDetails', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addIndex('customers', ['source'], {
      name: 'customers_source',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('customers', 'customers_source');
    await queryInterface.removeColumn('customers', 'sourceDetails');
    await queryInterface.removeColumn('customers', 'source');
  },
};
