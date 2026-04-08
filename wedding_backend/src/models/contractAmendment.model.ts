import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type ContractAmendmentStatus =
  | "draft"
  | "approved"
  | "applied"
  | "rejected"
  | "cancelled";

export interface ContractAmendmentAttributes {
  id: number;
  contractId: number;
  eventId: number;
  amendmentNumber?: string | null;
  reason?: string | null;
  notes?: string | null;
  status: ContractAmendmentStatus;
  subtotalDelta: number | string;
  discountDelta: number | string;
  totalDelta: number | string;
  requestedBy?: number | null;
  approvedBy?: number | null;
  requestedAt?: Date | null;
  approvedAt?: Date | null;
  appliedAt?: Date | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}

type ContractAmendmentCreationAttributes = Optional<
  ContractAmendmentAttributes,
  | "id"
  | "amendmentNumber"
  | "reason"
  | "notes"
  | "status"
  | "subtotalDelta"
  | "discountDelta"
  | "totalDelta"
  | "requestedBy"
  | "approvedBy"
  | "requestedAt"
  | "approvedAt"
  | "appliedAt"
  | "createdBy"
  | "updatedBy"
>;

export class ContractAmendment
  extends Model<
    ContractAmendmentAttributes,
    ContractAmendmentCreationAttributes
  >
  implements ContractAmendmentAttributes
{
  public id!: number;
  public contractId!: number;
  public eventId!: number;
  public amendmentNumber?: string | null;
  public reason?: string | null;
  public notes?: string | null;
  public status!: ContractAmendmentStatus;
  public subtotalDelta!: number | string;
  public discountDelta!: number | string;
  public totalDelta!: number | string;
  public requestedBy?: number | null;
  public approvedBy?: number | null;
  public requestedAt?: Date | null;
  public approvedAt?: Date | null;
  public appliedAt?: Date | null;
  public createdBy?: number | null;
  public updatedBy?: number | null;
}

ContractAmendment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    contractId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    eventId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    amendmentNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "draft",
        "approved",
        "applied",
        "rejected",
        "cancelled",
      ),
      allowNull: false,
      defaultValue: "draft",
    },

    subtotalDelta: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    },

    discountDelta: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    },

    totalDelta: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    },

    requestedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    approvedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    requestedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    appliedAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: "contract_amendments",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["contractId"] },
      { fields: ["eventId"] },
      { fields: ["status"] },
      { fields: ["requestedBy"] },
      { fields: ["approvedBy"] },
      { fields: ["amendmentNumber"] },
    ],
  },
);
