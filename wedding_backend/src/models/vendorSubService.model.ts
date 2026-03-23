import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { type VendorType, vendorTypeValues } from "./vendor.model";

export interface VendorSubServiceAttributes {
  id: number;
  vendorType: VendorType;
  name: string;
  code?: string | null;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdBy?: number | null;
  updatedBy?: number | null;
}

type VendorSubServiceCreationAttributes = Optional<
  VendorSubServiceAttributes,
  | "id"
  | "code"
  | "description"
  | "sortOrder"
  | "isActive"
  | "createdBy"
  | "updatedBy"
>;

export class VendorSubService
  extends Model<VendorSubServiceAttributes, VendorSubServiceCreationAttributes>
  implements VendorSubServiceAttributes
{
  public id!: number;
  public vendorType!: VendorType;
  public name!: string;
  public code?: string | null;
  public description?: string | null;
  public sortOrder!: number;
  public isActive!: boolean;
  public createdBy?: number | null;
  public updatedBy?: number | null;
}

VendorSubService.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    vendorType: {
      type: DataTypes.ENUM(...vendorTypeValues),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: "vendor_sub_services",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["vendorType"] },
      { fields: ["name"] },
      { fields: ["code"] },
      { fields: ["sortOrder"] },
      { fields: ["isActive"] },
    ],
  },
);
