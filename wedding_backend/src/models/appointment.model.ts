import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "rescheduled"
  | "cancelled"
  | "no_show";

export type AppointmentType =
  | "office_visit"
  | "phone_call"
  | "video_call"
  | "venue_visit";

export interface AppointmentAttributes {
  id: number;
  customerId: number;
  appointmentDate: string;
  startTime: string;
  endTime?: string | null;
  type: AppointmentType;
  notes?: string | null;
  status: AppointmentStatus;
  createdBy?: number | null;
  updatedBy?: number | null;
}

type AppointmentCreationAttributes = Optional<
  AppointmentAttributes,
  | "id"
  | "endTime"
  | "type"
  | "notes"
  | "status"
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
  public startTime!: string;
  public endTime?: string | null;
  public type!: AppointmentType;
  public notes?: string | null;
  public status!: AppointmentStatus;
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
    startTime: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: "appointmentStartTime",
    },
    endTime: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: "appointmentEndTime",
    },
    type: {
      type: DataTypes.ENUM(
        "office_visit",
        "phone_call",
        "video_call",
        "venue_visit",
      ),
      allowNull: false,
      defaultValue: "office_visit",
      field: "meetingType",
    },
    notes: {
      type: DataTypes.TEXT,
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
    ],
  },
);
