import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type EventStatus =
  | "draft"
  | "designing"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface EventAttributes {
  id: number;

  customerId?: number | null;
  leadId?: number | null;

  eventDate: string;

  venueId?: number | null;
  venueNameSnapshot?: string | null;

  groomName?: string | null;
  brideName?: string | null;

  guestCount?: number | null;

  contractNumber?: string | null;
  title?: string | null;
  notes?: string | null;

  status: EventStatus;

  createdBy?: number | null;
  updatedBy?: number | null;
}

type EventCreationAttributes = Optional<
  EventAttributes,
  | "id"
  | "customerId"
  | "leadId"
  | "venueId"
  | "venueNameSnapshot"
  | "groomName"
  | "brideName"
  | "guestCount"
  | "contractNumber"
  | "title"
  | "notes"
  | "status"
  | "createdBy"
  | "updatedBy"
>;

export class Event
  extends Model<EventAttributes, EventCreationAttributes>
  implements EventAttributes
{
  public id!: number;

  public customerId?: number | null;
  public leadId?: number | null;

  public eventDate!: string;

  public venueId?: number | null;
  public venueNameSnapshot?: string | null;

  public groomName?: string | null;
  public brideName?: string | null;

  public guestCount?: number | null;

  public contractNumber?: string | null;
  public title?: string | null;
  public notes?: string | null;

  public status!: EventStatus;

  public createdBy?: number | null;
  public updatedBy?: number | null;
}

Event.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    customerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    leadId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    eventDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    venueId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    venueNameSnapshot: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    groomName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    brideName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    guestCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    contractNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "draft",
        "designing",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
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
    tableName: "events",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["customerId"] },
      { fields: ["leadId"] },
      { fields: ["eventDate"] },
      { fields: ["venueId"] },
      { fields: ["status"] },
    ],
  },
);
