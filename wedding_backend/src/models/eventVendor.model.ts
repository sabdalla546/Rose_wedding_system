import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type EventVendorProvidedBy = "company" | "client";
export type EventVendorStatus =
  | "pending"
  | "approved"
  | "confirmed"
  | "cancelled";

export interface EventVendorAttributes {
  id: number;
  eventId: number;
  vendorType: string;
  providedBy: EventVendorProvidedBy;

  vendorId?: number | null;
  companyNameSnapshot?: string | null;
  pricingPlanId?: number | null;
  selectedSubServicesCount: number;
  agreedPrice?: number | string | null;

  notes?: string | null;
  status: EventVendorStatus;

  createdBy?: number | null;
  updatedBy?: number | null;
}

type EventVendorCreationAttributes = Optional<
  EventVendorAttributes,
  | "id"
  | "vendorId"
  | "companyNameSnapshot"
  | "pricingPlanId"
  | "selectedSubServicesCount"
  | "agreedPrice"
  | "notes"
  | "status"
  | "createdBy"
  | "updatedBy"
>;

export class EventVendor
  extends Model<EventVendorAttributes, EventVendorCreationAttributes>
  implements EventVendorAttributes
{
  public id!: number;
  public eventId!: number;
  public vendorType!: string;
  public providedBy!: EventVendorProvidedBy;

  public vendorId?: number | null;
  public companyNameSnapshot?: string | null;
  public pricingPlanId?: number | null;
  public selectedSubServicesCount!: number;
  public agreedPrice?: number | string | null;

  public notes?: string | null;
  public status!: EventVendorStatus;

  public createdBy?: number | null;
  public updatedBy?: number | null;
}

EventVendor.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    eventId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    vendorType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    providedBy: {
      type: DataTypes.ENUM("company", "client"),
      allowNull: false,
    },

    vendorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    companyNameSnapshot: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    pricingPlanId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    selectedSubServicesCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },

    agreedPrice: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("pending", "approved", "confirmed", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
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
    tableName: "event_vendors",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["eventId"] },
      { fields: ["vendorId"] },
      { fields: ["pricingPlanId"] },
      { fields: ["vendorType"] },
      { fields: ["selectedSubServicesCount"] },
      { fields: ["providedBy"] },
      { fields: ["status"] },
    ],
  },
);
