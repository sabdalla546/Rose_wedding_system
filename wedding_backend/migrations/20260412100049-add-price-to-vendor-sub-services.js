"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("vendor_sub_services");

    if (!table.price) {
      await queryInterface.addColumn("vendor_sub_services", "price", {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0,
        after: "description",
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("vendor_sub_services");

    if (table.price) {
      await queryInterface.removeColumn("vendor_sub_services", "price");
    }
  },
};
