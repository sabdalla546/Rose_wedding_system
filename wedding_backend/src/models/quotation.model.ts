import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type QuotationStatus =
  | "draft"
  | "sent"
  | "approved"
  | "rejected"
  | "expired"
  | "converted_to_contract";

export interface QuotationAttributes {
  id: number;

  eventId: number;
  customerId?: number | null;
  leadId?: number | null;

  quotationNumber?: string | null;
  issueDate: string;
  validUntil?: string | null;

  subtotal?: number | null;
  discountAmount?: number | null;
  totalAmount?: number | null;

  notes?: string | null;
  status: QuotationStatus;

  createdBy?: number | null;
  updatedBy?: number | null;
}

type QuotationCreationAttributes = Optional<
  QuotationAttributes,
  | "id"
  | "customerId"
  | "leadId"
  | "quotationNumber"
  | "validUntil"
  | "subtotal"
  | "discountAmount"
  | "totalAmount"
  | "notes"
  | "status"
  | "createdBy"
  | "updatedBy"
>;

export class Quotation
  extends Model<QuotationAttributes, QuotationCreationAttributes>
  implements QuotationAttributes
{
  public id!: number;

  public eventId!: number;
  public customerId?: number | null;
  public leadId?: number | null;

  public quotationNumber?: string | null;
  public issueDate!: string;
  public validUntil?: string | null;

  public subtotal?: number | null;
  public discountAmount?: number | null;
  public totalAmount?: number | null;

  public notes?: string | null;
  public status!: QuotationStatus;

  public createdBy?: number | null;
  public updatedBy?: number | null;
}

Quotation.init(
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

    customerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    leadId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    quotationNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    issueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    validUntil: {
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
        "sent",
        "approved",
        "rejected",
        "expired",
        "converted_to_contract",
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
    tableName: "quotations",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["eventId"] },
      { fields: ["customerId"] },
      { fields: ["leadId"] },
      { fields: ["quotationNumber"] },
      { fields: ["issueDate"] },
      { fields: ["status"] },
    ],
  },
);
