"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable(
      "event_vendor_sub_services",
    );

    if (!table.priceSnapshot) {
      await queryInterface.addColumn(
        "event_vendor_sub_services",
        "priceSnapshot",
        {
          type: Sequelize.DECIMAL(12, 3),
          allowNull: false,
          defaultValue: 0,
          after: "nameSnapshot",
        },
      );
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable(
      "event_vendor_sub_services",
    );

    if (table.priceSnapshot) {
      await queryInterface.removeColumn(
        "event_vendor_sub_services",
        "priceSnapshot",
      );
    }
  },
};
