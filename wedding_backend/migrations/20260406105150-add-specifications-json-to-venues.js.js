"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("venues", "specificationsJson", {
      type: Sequelize.JSON,
      allowNull: true,
      after: "isActive",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("venues", "specificationsJson");
  },
};
