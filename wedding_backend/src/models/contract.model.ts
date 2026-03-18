import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type ContractStatus =
  | "draft"
  | "active"
  | "completed"
  | "cancelled"
  | "terminated";

export interface ContractAttributes {
  id: number;

  quotationId?: number | null;
  eventId: number;
  customerId?: number | null;
  leadId?: number | null;

  contractNumber?: string | null;
  signedDate: string;
  eventDate?: string | null;

  subtotal?: number | null;
  discountAmount?: number | null;
  totalAmount?: number | null;

  notes?: string | null;
  status: ContractStatus;

  createdBy?: number | null;
  updatedBy?: number | null;
}

type ContractCreationAttributes = Optional<
  ContractAttributes,
  | "id"
  | "quotationId"
  | "customerId"
  | "leadId"
  | "contractNumber"
  | "eventDate"
  | "subtotal"
  | "discountAmount"
  | "totalAmount"
  | "notes"
  | "status"
  | "createdBy"
  | "updatedBy"
>;

export class Contract
  extends Model<ContractAttributes, ContractCreationAttributes>
  implements ContractAttributes
{
  public id!: number;

  public quotationId?: number | null;
  public eventId!: number;
  public customerId?: number | null;
  public leadId?: number | null;

  public contractNumber?: string | null;
  public signedDate!: string;
  public eventDate?: string | null;

  public subtotal?: number | null;
  public discountAmount?: number | null;
  public totalAmount?: number | null;

  public notes?: string | null;
  public status!: ContractStatus;

  public createdBy?: number | null;
  public updatedBy?: number | null;
}

Contract.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    quotationId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    eventId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    customerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    leadId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    contractNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    signedDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    eventDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    subtotal: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true,
    },

    discountAmount: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true,
      defaultValue: 0,
    },

    totalAmount: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "draft",
        "active",
        "completed",
        "cancelled",
        "terminated",
      ),
      allowNull: false,
      defaultValue: "draft",
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
    tableName: "contracts",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["quotationId"] },
      { fields: ["eventId"] },
      { fields: ["customerId"] },
      { fields: ["leadId"] },
      { fields: ["contractNumber"] },
      { fields: ["signedDate"] },
      { fields: ["status"] },
    ],
  },
);
