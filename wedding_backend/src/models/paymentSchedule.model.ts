import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type PaymentScheduleType = "deposit" | "installment" | "final";
export type PaymentScheduleStatus =
  | "pending"
  | "paid"
  | "cancelled"
  | "overdue";

export interface PaymentScheduleAttributes {
  id: number;
  contractId: number;

  installmentName: string;
  scheduleType: PaymentScheduleType;

  dueDate?: string | null;
  amount: number;

  status: PaymentScheduleStatus;
  notes?: string | null;
  sortOrder: number;

  createdBy?: number | null;
  updatedBy?: number | null;
}

type PaymentScheduleCreationAttributes = Optional<
  PaymentScheduleAttributes,
  | "id"
  | "dueDate"
  | "status"
  | "notes"
  | "sortOrder"
  | "createdBy"
  | "updatedBy"
>;

export class PaymentSchedule
  extends Model<PaymentScheduleAttributes, PaymentScheduleCreationAttributes>
  implements PaymentScheduleAttributes
{
  public id!: number;
  public contractId!: number;

  public installmentName!: string;
  public scheduleType!: PaymentScheduleType;

  public dueDate?: string | null;
  public amount!: number;

  public status!: PaymentScheduleStatus;
  public notes?: string | null;
  public sortOrder!: number;

  public createdBy?: number | null;
  public updatedBy?: number | null;
}

PaymentSchedule.init(
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

    installmentName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    scheduleType: {
      type: DataTypes.ENUM("deposit", "installment", "final"),
      allowNull: false,
    },

    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    amount: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("pending", "paid", "cancelled", "overdue"),
      allowNull: false,
      defaultValue: "pending",
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    sortOrder: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "payment_schedules",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["contractId"] },
      { fields: ["scheduleType"] },
      { fields: ["status"] },
      { fields: ["dueDate"] },
      { fields: ["sortOrder"] },
    ],
  },
);
