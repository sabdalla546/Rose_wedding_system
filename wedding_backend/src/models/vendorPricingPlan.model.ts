import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { type VendorType, vendorTypeValues } from "./vendor.model";

export interface VendorPricingPlanAttributes {
  id: number;
  vendorType: VendorType;
  name: string;
  minSubServices: number;
  maxSubServices?: number | null;
  price: number | string;
  notes?: string | null;
  isActive: boolean;
  createdBy?: number | null;
  updatedBy?: number | null;
}

type VendorPricingPlanCreationAttributes = Optional<
  VendorPricingPlanAttributes,
  | "id"
  | "maxSubServices"
  | "notes"
  | "isActive"
  | "createdBy"
  | "updatedBy"
>;

export class VendorPricingPlan
  extends Model<VendorPricingPlanAttributes, VendorPricingPlanCreationAttributes>
  implements VendorPricingPlanAttributes
{
  public id!: number;
  public vendorType!: VendorType;
  public name!: string;
  public minSubServices!: number;
  public maxSubServices?: number | null;
  public price!: number | string;
  public notes?: string | null;
  public isActive!: boolean;
  public createdBy?: number | null;
  public updatedBy?: number | null;
}

VendorPricingPlan.init(
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
    minSubServices: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    maxSubServices: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: "vendor_pricing_plans",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["vendorType"] },
      { fields: ["name"] },
      { fields: ["minSubServices"] },
      { fields: ["maxSubServices"] },
      { fields: ["isActive"] },
    ],
  },
);
