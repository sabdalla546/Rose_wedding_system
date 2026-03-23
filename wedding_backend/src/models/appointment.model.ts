// src/models/appointment.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "rescheduled"
  | "cancelled"
  | "no_show";

export type AppointmentMeetingType =
  | "office_visit"
  | "phone_call"
  | "video_call"
  | "venue_visit";

export interface AppointmentAttributes {
  id: number;
  customerId: number;

  appointmentDate: string;
  appointmentStartTime: string;
  appointmentEndTime?: string | null;

  status: AppointmentStatus;
  meetingType: AppointmentMeetingType;

  assignedToUserId?: number | null;

  notes?: string | null;
  result?: string | null;
  nextStep?: string | null;

  createdBy?: number | null;
  updatedBy?: number | null;
}

type AppointmentCreationAttributes = Optional<
  AppointmentAttributes,
  | "id"
  | "appointmentEndTime"
  | "status"
  | "meetingType"
  | "assignedToUserId"
  | "notes"
  | "result"
  | "nextStep"
  | "createdBy"
  | "updatedBy"
>;

export class Appointment
  extends Model<AppointmentAttributes, AppointmentCreationAttributes>
  implements AppointmentAttributes
{
  public id!: number;
  public customerId!: number;

  public appointmentDate!: string;
  public appointmentStartTime!: string;
  public appointmentEndTime?: string | null;

  public status!: AppointmentStatus;
  public meetingType!: AppointmentMeetingType;

  public assignedToUserId?: number | null;

  public notes?: string | null;
  public result?: string | null;
  public nextStep?: string | null;

  public createdBy?: number | null;
  public updatedBy?: number | null;
}

Appointment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    customerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    appointmentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    appointmentStartTime: {
      type: DataTypes.STRING(10), // HH:mm
      allowNull: false,
    },

    appointmentEndTime: {
      type: DataTypes.STRING(10), // HH:mm
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "scheduled",
        "confirmed",
        "completed",
        "rescheduled",
        "cancelled",
        "no_show",
      ),
      allowNull: false,
      defaultValue: "scheduled",
    },

    meetingType: {
      type: DataTypes.ENUM(
        "office_visit",
        "phone_call",
        "video_call",
        "venue_visit",
      ),
      allowNull: false,
      defaultValue: "office_visit",
    },

    assignedToUserId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    result: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    nextStep: {
      type: DataTypes.STRING(255),
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
    tableName: "appointments",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["customerId"] },
      { fields: ["appointmentDate"] },
      { fields: ["status"] },
      { fields: ["assignedToUserId"] },
    ],
  },
);
