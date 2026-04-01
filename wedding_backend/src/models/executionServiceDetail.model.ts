import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type ExecutionServiceDetailStatus =
  | "pending"
  | "draft"
  | "ready"
  | "in_progress"
  | "done";

export interface ExecutionServiceDetailAttributes {
  id: number;
  briefId: number;
  eventId: number;
  serviceId: number;
  serviceNameSnapshot?: string | null;
  templateKey: string;
  sortOrder: number;
  detailsJson?: Record<string, unknown> | null;
  notes?: string | null;
  executorNotes?: string | null;
  status: ExecutionServiceDetailStatus;
}

type ExecutionServiceDetailCreationAttributes = Optional<
  ExecutionServiceDetailAttributes,
  | "id"
  | "serviceNameSnapshot"
  | "sortOrder"
  | "detailsJson"
  | "notes"
  | "executorNotes"
  | "status"
>;

export class ExecutionServiceDetail
  extends Model<
    ExecutionServiceDetailAttributes,
    ExecutionServiceDetailCreationAttributes
  >
  implements ExecutionServiceDetailAttributes
{
  public id!: number;
  public briefId!: number;
  public eventId!: number;
  public serviceId!: number;
  public serviceNameSnapshot?: string | null;
  public templateKey!: string;
  public sortOrder!: number;
  public detailsJson?: Record<string, unknown> | null;
  public notes?: string | null;
  public executorNotes?: string | null;
  public status!: ExecutionServiceDetailStatus;
}

ExecutionServiceDetail.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    briefId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    eventId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    serviceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    serviceNameSnapshot: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    templateKey: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    detailsJson: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    executorNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    sequelize,
    tableName: "execution_service_details",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["briefId"] },
      { fields: ["eventId"] },
      { fields: ["serviceId"] },
      { fields: ["templateKey"] },
      { fields: ["status"] },
      { unique: true, fields: ["briefId", "serviceId"] },
    ],
  },
);
