"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("contract_amendments", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      contractId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "contracts",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      eventId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "events",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      amendmentNumber: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      reason: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      status: {
        type: Sequelize.ENUM(
          "draft",
          "approved",
          "applied",
          "rejected",
          "cancelled",
        ),
        allowNull: false,
        defaultValue: "draft",
      },

      subtotalDelta: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0,
      },

      discountDelta: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0,
      },

      totalDelta: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0,
      },

      requestedBy: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      approvedBy: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      requestedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      approvedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      appliedAt: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex("contract_amendments", ["contractId"]);
    await queryInterface.addIndex("contract_amendments", ["eventId"]);
    await queryInterface.addIndex("contract_amendments", ["status"]);
    await queryInterface.addIndex("contract_amendments", ["requestedBy"]);
    await queryInterface.addIndex("contract_amendments", ["approvedBy"]);
    await queryInterface.addIndex("contract_amendments", ["amendmentNumber"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("contract_amendments");
    await queryInterface.sequelize
      .query("DROP TYPE IF EXISTS enum_contract_amendments_status;")
      .catch(() => {});
  },
};
