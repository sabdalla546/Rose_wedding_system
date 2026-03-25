import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface QuotationItemAttributes {
  id: number;
  quotationId: number;

  itemType: "service" | "vendor";
  eventServiceId?: number | null;
  serviceId?: number | null;
  eventVendorId?: number | null;
  vendorId?: number | null;
  pricingPlanId?: number | null;

  itemName: string;
  category?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  totalPrice?: number | null;

  notes?: string | null;
  sortOrder: number;

  createdBy?: number | null;
  updatedBy?: number | null;
}

type QuotationItemCreationAttributes = Optional<
  QuotationItemAttributes,
  | "id"
  | "itemType"
  | "eventServiceId"
  | "serviceId"
  | "eventVendorId"
  | "vendorId"
  | "pricingPlanId"
  | "category"
  | "quantity"
  | "unitPrice"
  | "totalPrice"
  | "notes"
  | "sortOrder"
  | "createdBy"
  | "updatedBy"
>;

export class QuotationItem
  extends Model<QuotationItemAttributes, QuotationItemCreationAttributes>
  implements QuotationItemAttributes
{
  public id!: number;
  public quotationId!: number;

  public itemType!: "service" | "vendor";
  public eventServiceId?: number | null;
  public serviceId?: number | null;
  public eventVendorId?: number | null;
  public vendorId?: number | null;
  public pricingPlanId?: number | null;

  public itemName!: string;
  public category?: string | null;
  public quantity?: number | null;
  public unitPrice?: number | null;
  public totalPrice?: number | null;

  public notes?: string | null;
  public sortOrder!: number;

  public createdBy?: number | null;
  public updatedBy?: number | null;
}

QuotationItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    quotationId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    itemType: {
      type: DataTypes.ENUM("service", "vendor"),
      allowNull: false,
      defaultValue: "service",
    },

    eventServiceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    serviceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    eventVendorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    vendorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    pricingPlanId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    itemName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 1,
    },

    unitPrice: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    },

    totalPrice: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    sortOrder: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },

    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    updatedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "quotation_items",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["quotationId"] },
      { fields: ["itemType"] },
      { fields: ["eventServiceId"] },
      { fields: ["serviceId"] },
      { fields: ["eventVendorId"] },
      { fields: ["vendorId"] },
      { fields: ["pricingPlanId"] },
      { fields: ["category"] },
      { fields: ["sortOrder"] },
    ],
  },
);
