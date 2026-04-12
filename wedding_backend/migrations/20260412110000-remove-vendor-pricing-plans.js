"use strict";

const VENDOR_TYPE_VALUES = [
  "dj",
  "zaffa",
  "lighting",
  "photography",
  "hospitality",
  "cake",
  "flowers",
  "sweets",
  "security",
  "other",
  "perfumes",
  "rent_cars",
  "organizing",
  "makeup_artist",
  "abya_w_tarha",
  "dresses",
  "accessories",
  "shoes_bags",
  "gift_boxes",
  "catering",
  "coffee_station",
  "cheese",
  "sweets_savories",
  "dinner",
  "ac_generator",
  "female_supplies",
  "videographer",
  "sound_system",
  "family_services",
];

const tableExists = async (queryInterface, tableName) => {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch {
    return false;
  }
};

const removeColumnIfExists = async (queryInterface, tableName, columnName) => {
  if (!(await tableExists(queryInterface, tableName))) {
    return;
  }

  const table = await queryInterface.describeTable(tableName);
  if (table[columnName]) {
    await queryInterface.removeColumn(tableName, columnName);
  }
};

const addColumnIfMissing = async (queryInterface, tableName, columnName, definition) => {
  if (!(await tableExists(queryInterface, tableName))) {
    return;
  }

  const table = await queryInterface.describeTable(tableName);
  if (!table[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
};

module.exports = {
  async up(queryInterface) {
    await removeColumnIfExists(queryInterface, "event_vendors", "pricingPlanId");
    await removeColumnIfExists(queryInterface, "quotation_items", "pricingPlanId");
    await removeColumnIfExists(queryInterface, "contract_items", "pricingPlanId");

    if (await tableExists(queryInterface, "vendor_pricing_plans")) {
      await queryInterface.dropTable("vendor_pricing_plans");
    }
  },

  async down(queryInterface, Sequelize) {
    if (!(await tableExists(queryInterface, "vendor_pricing_plans"))) {
      await queryInterface.createTable("vendor_pricing_plans", {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        vendorId: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
          references: {
            model: "vendors",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        },
        vendorType: {
          type: Sequelize.ENUM(...VENDOR_TYPE_VALUES),
          allowNull: true,
        },
        name: {
          type: Sequelize.STRING(150),
          allowNull: false,
        },
        minSubServices: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
        },
        maxSubServices: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
        },
        price: {
          type: Sequelize.DECIMAL(12, 3),
          allowNull: false,
          defaultValue: 0,
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
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
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        deletedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      });

      await queryInterface.addIndex("vendor_pricing_plans", ["vendorId"], {
        name: "vendor_pricing_plans_vendor_id",
      });
      await queryInterface.addIndex("vendor_pricing_plans", ["vendorType"], {
        name: "vendor_pricing_plans_vendor_type",
      });
      await queryInterface.addIndex("vendor_pricing_plans", ["name"], {
        name: "vendor_pricing_plans_name",
      });
      await queryInterface.addIndex("vendor_pricing_plans", ["minSubServices"], {
        name: "vendor_pricing_plans_min_sub_services",
      });
      await queryInterface.addIndex("vendor_pricing_plans", ["maxSubServices"], {
        name: "vendor_pricing_plans_max_sub_services",
      });
      await queryInterface.addIndex("vendor_pricing_plans", ["isActive"], {
        name: "vendor_pricing_plans_is_active",
      });
    }

    await addColumnIfMissing(queryInterface, "event_vendors", "pricingPlanId", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "vendor_pricing_plans",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await addColumnIfMissing(queryInterface, "quotation_items", "pricingPlanId", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "vendor_pricing_plans",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await addColumnIfMissing(queryInterface, "contract_items", "pricingPlanId", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "vendor_pricing_plans",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    if (await tableExists(queryInterface, "event_vendors")) {
      await queryInterface.addIndex("event_vendors", ["pricingPlanId"], {
        name: "event_vendors_pricing_plan_id",
      });
    }

    if (await tableExists(queryInterface, "quotation_items")) {
      await queryInterface.addIndex("quotation_items", ["pricingPlanId"], {
        name: "quotation_items_pricing_plan_id",
      });
    }

    if (await tableExists(queryInterface, "contract_items")) {
      await queryInterface.addIndex("contract_items", ["pricingPlanId"], {
        name: "contract_items_pricing_plan_id",
      });
    }
  },
};
