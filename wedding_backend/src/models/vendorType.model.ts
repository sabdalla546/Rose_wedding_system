import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface VendorTypeAttributes {
  id: number;
  name: string;
  nameAr: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdBy?: number | null;
  updatedBy?: number | null;
}

type VendorTypeCreationAttributes = Optional<
  VendorTypeAttributes,
  "id" | "isActive" | "sortOrder" | "createdBy" | "updatedBy"
>;

export class VendorType
  extends Model<VendorTypeAttributes, VendorTypeCreationAttributes>
  implements VendorTypeAttributes
{
  public id!: number;
  public name!: string;
  public nameAr!: string;
  public slug!: string;
  public isActive!: boolean;
  public sortOrder!: number;
  public createdBy?: number | null;
  public updatedBy?: number | null;
}

VendorType.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    nameAr: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
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
    tableName: "vendor_types",
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ["slug"] },
      { fields: ["isActive"] },
      { fields: ["sortOrder"] },
    ],
  },
);
