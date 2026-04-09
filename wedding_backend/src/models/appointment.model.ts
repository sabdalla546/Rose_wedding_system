import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { APPOINTMENT_STATUSES } from "../constants/workflow-statuses";

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export type AppointmentType =
  | "New Appointment 1"
  | "New Appointment 2"
  | "New Appointment 3"
  | "Details Appointment 1"
  | "Details Appointment 2"
  | "Details Appointment 3"
  | "Office Visit 1"
  | "Office Visit 2"
  | "Office Visit 3";

export interface AppointmentAttributes {
  id: number;
  customerId: number;
  appointmentDate: string;
  startTime: string;
  endTime?: string | null;
  type: AppointmentType;
  weddingDate?: string | null;
  guestCount?: number | null;
  venueId?: number | null;
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
  | "weddingDate"
  | "guestCount"
  | "venueId"
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
  public weddingDate?: string | null;
  public guestCount?: number | null;
  public venueId?: number | null;
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
        "New Appointment 1",
        "New Appointment 2",
        "New Appointment 3",
        "Details Appointment 1",
        "Details Appointment 2",
        "Details Appointment 3",
        "Office Visit 1",
        "Office Visit 2",
        "Office Visit 3",
      ),
      allowNull: false,
      defaultValue: "Office Visit 1",
      field: "meetingType",
    },
    weddingDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    guestCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    venueId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...APPOINTMENT_STATUSES),
      allowNull: false,
      defaultValue: "reserved",
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
      { fields: ["venueId"] },
      { fields: ["status"] },
    ],
  },
);
