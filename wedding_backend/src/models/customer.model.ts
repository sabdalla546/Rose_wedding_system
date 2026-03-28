import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type CustomerStatus = "active" | "inactive";

export interface CustomerAttributes {
  id: number;
  fullName: string;
  mobile: string;
  mobile2?: string | null;
  email?: string | null;
  nationalId?: string | null;
  address?: string | null;
  notes?: string | null;
  status: CustomerStatus;
  createdBy?: number | null;
  updatedBy?: number | null;
}

type CustomerCreationAttributes = Optional<
  CustomerAttributes,
  | "id"
  | "mobile2"
  | "email"
  | "nationalId"
  | "address"
  | "notes"
  | "status"
  | "createdBy"
  | "updatedBy"
>;

export class Customer
  extends Model<CustomerAttributes, CustomerCreationAttributes>
  implements CustomerAttributes
{
  public id!: number;
  public fullName!: string;
  public mobile!: string;
  public mobile2?: string | null;
  public email?: string | null;
  public nationalId?: string | null;
  public address?: string | null;
  public notes?: string | null;
  public status!: CustomerStatus;
  public createdBy?: number | null;
  public updatedBy?: number | null;
}

Customer.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    mobile2: {
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
    nationalId: {
      type: DataTypes.STRING(12),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
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
    tableName: "customers",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["mobile"] },
      { fields: ["nationalId"] },
      { fields: ["status"] },
    ],
  },
);
