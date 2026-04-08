"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("contract_amendment_items", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      amendmentId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "contract_amendments",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      changeType: {
        type: Sequelize.ENUM("add_service", "remove_service"),
        allowNull: false,
      },

      targetContractItemId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "contract_items",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      targetEventServiceId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "event_services",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      targetExecutionServiceDetailId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "execution_service_details",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      serviceId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "services",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      itemName: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },

      category: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      quantity: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: true,
      },

      unitPrice: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: true,
      },

      totalPrice: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: true,
      },

      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      sortOrder: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },

      status: {
        type: Sequelize.ENUM("pending", "applied", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
      },

      createdBy: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      updatedBy: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex("contract_amendment_items", ["amendmentId"]);
    await queryInterface.addIndex("contract_amendment_items", ["changeType"]);
    await queryInterface.addIndex("contract_amendment_items", ["status"]);
    await queryInterface.addIndex("contract_amendment_items", [
      "targetContractItemId",
    ]);
    await queryInterface.addIndex("contract_amendment_items", [
      "targetEventServiceId",
    ]);
    await queryInterface.addIndex("contract_amendment_items", [
      "targetExecutionServiceDetailId",
    ]);
    await queryInterface.addIndex("contract_amendment_items", ["serviceId"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("contract_amendment_items");
    await queryInterface.sequelize
      .query("DROP TYPE IF EXISTS enum_contract_amendment_items_changeType;")
      .catch(() => {});
    await queryInterface.sequelize
      .query("DROP TYPE IF EXISTS enum_contract_amendment_items_status;")
      .catch(() => {});
  },
};
