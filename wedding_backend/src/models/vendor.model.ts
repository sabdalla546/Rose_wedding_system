import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export const vendorTypeValues = [
  "dj",
  "lighting",
  "barcode",
  "photography",
  "perfumes",
  "coffee_station",
  "cheese",
  "ac_generator",
  "bleachers",
  "instant_photography",
  "valet",
  "female_supplies",
  "family_services",
  "sweets_savories",
  "other",
] as const;

export type VendorType =
  | (typeof vendorTypeValues)[number];

export interface VendorAttributes {
  id: number;
  name: string;
  type: VendorType;
  contactPerson?: string | null;
  phone?: string | null;
  phone2?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;

  createdBy?: number | null;
  updatedBy?: number | null;
}

type VendorCreationAttributes = Optional<
  VendorAttributes,
  | "id"
  | "contactPerson"
  | "phone"
  | "phone2"
  | "email"
  | "address"
  | "notes"
  | "isActive"
  | "createdBy"
  | "updatedBy"
>;

export class Vendor
  extends Model<VendorAttributes, VendorCreationAttributes>
  implements VendorAttributes
{
  public id!: number;
  public name!: string;
  public type!: VendorType;
  public contactPerson?: string | null;
  public phone?: string | null;
  public phone2?: string | null;
  public email?: string | null;
  public address?: string | null;
  public notes?: string | null;
  public isActive!: boolean;

  public createdBy?: number | null;
  public updatedBy?: number | null;
}

Vendor.init(
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

    type: {
      type: DataTypes.ENUM(...vendorTypeValues),
      allowNull: false,
    },

    contactPerson: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    phone2: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },

    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
    tableName: "vendors",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["name"] },
      { fields: ["type"] },
      { fields: ["isActive"] },
    ],
  },
);
