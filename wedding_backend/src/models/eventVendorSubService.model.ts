import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface EventVendorSubServiceAttributes {
  id: number;
  eventVendorId: number;
  vendorSubServiceId?: number | null;
  nameSnapshot: string;
  notes?: string | null;
  sortOrder: number;
  createdBy?: number | null;
  updatedBy?: number | null;
}

type EventVendorSubServiceCreationAttributes = Optional<
  EventVendorSubServiceAttributes,
  | "id"
  | "vendorSubServiceId"
  | "notes"
  | "sortOrder"
  | "createdBy"
  | "updatedBy"
>;

export class EventVendorSubService
  extends Model<
    EventVendorSubServiceAttributes,
    EventVendorSubServiceCreationAttributes
  >
  implements EventVendorSubServiceAttributes
{
  public id!: number;
  public eventVendorId!: number;
  public vendorSubServiceId?: number | null;
  public nameSnapshot!: string;
  public notes?: string | null;
  public sortOrder!: number;
  public createdBy?: number | null;
  public updatedBy?: number | null;
}

EventVendorSubService.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    eventVendorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    vendorSubServiceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    nameSnapshot: {
      type: DataTypes.STRING(150),
      allowNull: false,
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
    tableName: "event_vendor_sub_services",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["eventVendorId"] },
      { fields: ["vendorSubServiceId"] },
      { fields: ["sortOrder"] },
    ],
  },
);
