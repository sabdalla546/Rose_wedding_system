import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import { EXECUTION_BRIEF_STATUSES } from "../constants/workflow-statuses";

export type ExecutionBriefStatus = (typeof EXECUTION_BRIEF_STATUSES)[number];

export interface ExecutionBriefAttributes {
  id: number;
  eventId: number;
  quotationId?: number | null;
  contractId?: number | null;
  status: ExecutionBriefStatus;
  generalNotes?: string | null;
  clientNotes?: string | null;
  designerNotes?: string | null;
  approvedByClientAt?: Date | null;
  handedToExecutorAt?: Date | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}

type ExecutionBriefCreationAttributes = Optional<
  ExecutionBriefAttributes,
  | "id"
  | "quotationId"
  | "contractId"
  | "status"
  | "generalNotes"
  | "clientNotes"
  | "designerNotes"
  | "approvedByClientAt"
  | "handedToExecutorAt"
  | "createdBy"
  | "updatedBy"
>;

export class ExecutionBrief
  extends Model<ExecutionBriefAttributes, ExecutionBriefCreationAttributes>
  implements ExecutionBriefAttributes
{
  public id!: number;
  public eventId!: number;
  public quotationId?: number | null;
  public contractId?: number | null;
  public status!: ExecutionBriefStatus;
  public generalNotes?: string | null;
  public clientNotes?: string | null;
  public designerNotes?: string | null;
  public approvedByClientAt?: Date | null;
  public handedToExecutorAt?: Date | null;
  public createdBy?: number | null;
  public updatedBy?: number | null;
}

ExecutionBrief.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    eventId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
    },
    quotationId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    contractId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: "draft",
    },
    generalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    clientNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    designerNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approvedByClientAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    handedToExecutorAt: {
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
    tableName: "execution_briefs",
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ["eventId"] },
      { fields: ["quotationId"] },
      { fields: ["contractId"] },
      { fields: ["status"] },
      { fields: ["createdBy"] },
      { fields: ["updatedBy"] },
    ],
  },
);
