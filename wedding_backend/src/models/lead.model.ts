// src/models/lead.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type LeadStatus =
  | "new"
  | "contacted"
  | "appointment_scheduled"
  | "appointment_completed"
  | "quotation_sent"
  | "contract_pending"
  | "converted"
  | "lost"
  | "cancelled";

export interface LeadAttributes {
  id: number;
  fullName: string;
  mobile: string;
  mobile2?: string | null;
  email?: string | null;

  weddingDate: string;
  guestCount?: number | null;

  venueId?: number | null;
  venueNameSnapshot?: string | null;

  source?: string | null;
  status: LeadStatus;
  notes?: string | null;

  convertedToCustomer: boolean;
  convertedCustomerId?: number | null;

  createdBy?: number | null;
  updatedBy?: number | null;
}

type LeadCreationAttributes = Optional<
  LeadAttributes,
  | "id"
  | "mobile2"
  | "email"
  | "guestCount"
  | "venueId"
  | "venueNameSnapshot"
  | "source"
  | "status"
  | "notes"
  | "convertedToCustomer"
  | "convertedCustomerId"
  | "createdBy"
  | "updatedBy"
>;

export class Lead
  extends Model<LeadAttributes, LeadCreationAttributes>
  implements LeadAttributes
{
  public id!: number;
  public fullName!: string;
  public mobile!: string;
  public mobile2?: string | null;
  public email?: string | null;

  public weddingDate!: string;
  public guestCount?: number | null;

  public venueId?: number | null;
  public venueNameSnapshot?: string | null;

  public source?: string | null;
  public status!: LeadStatus;
  public notes?: string | null;

  public convertedToCustomer!: boolean;
  public convertedCustomerId?: number | null;

  public createdBy?: number | null;
  public updatedBy?: number | null;
}

Lead.init(
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

    weddingDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    guestCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    venueId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    venueNameSnapshot: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    source: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "new",
        "contacted",
        "appointment_scheduled",
        "appointment_completed",
        "quotation_sent",
        "contract_pending",
        "converted",
        "lost",
        "cancelled",
      ),
      allowNull: false,
      defaultValue: "new",
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    convertedToCustomer: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    convertedCustomerId: {
      type: DataTypes.INTEGER.UNSIGNED,
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
    tableName: "leads",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["mobile"] },
      { fields: ["weddingDate"] },
      { fields: ["status"] },
      { fields: ["venueId"] },
      { fields: ["createdBy"] },
    ],
  },
);
