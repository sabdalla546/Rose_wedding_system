import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "rescheduled"
  | "cancelled"
  | "no_show";

export type AppointmentTypeDb =
  | "office_visit"
  | "phone_call"
  | "video_call"
  | "venue_visit";

// Public (API) appointment types requested by product.
export type AppointmentType =
  | "New Appointment 1"
  | "New Appointment 2"
  | "New Appointment 3"
  | "Details Appointment 1"
  | "Details Appointment 2"
  | "Details Appointment 3"
  | "Office Visit";

export const appointmentTypePublicFromDb = (value: AppointmentTypeDb): AppointmentType => {
  switch (value) {
    case "office_visit":
      return "Office Visit";
    case "phone_call":
      return "New Appointment 1";
    case "video_call":
      return "New Appointment 2";
    case "venue_visit":
      return "New Appointment 3";
    default:
      return "Office Visit";
  }
};

export const appointmentTypeDbFromPublic = (
  value: AppointmentType,
): AppointmentTypeDb => {
  switch (value) {
    case "Office Visit":
      return "office_visit";
    case "New Appointment 1":
      return "phone_call";
    case "New Appointment 2":
      return "video_call";
    case "New Appointment 3":
      return "venue_visit";
    // Map detail appointments to the closest available DB enum for now.
    case "Details Appointment 1":
      return "office_visit";
    case "Details Appointment 2":
      return "office_visit";
    case "Details Appointment 3":
      return "office_visit";
    default:
      return "office_visit";
  }
};

export const normalizeAppointmentTypeToDb = (
  value?: AppointmentType | AppointmentTypeDb | string | null,
): AppointmentTypeDb | undefined => {
  if (!value) return undefined;

  // Already DB value.
  if (
    value === "office_visit" ||
    value === "phone_call" ||
    value === "video_call" ||
    value === "venue_visit"
  ) {
    return value;
  }

  // Public value.
  if (
    value === "New Appointment 1" ||
    value === "New Appointment 2" ||
    value === "New Appointment 3" ||
    value === "Details Appointment 1" ||
    value === "Details Appointment 2" ||
    value === "Details Appointment 3" ||
    value === "Office Visit"
  ) {
    return appointmentTypeDbFromPublic(value);
  }

  return undefined;
};

export interface AppointmentAttributes {
  id: number;
  customerId: number;
  appointmentDate: string;
  startTime: string;
  endTime?: string | null;
  type: AppointmentTypeDb;
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
  public type!: AppointmentTypeDb;
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
