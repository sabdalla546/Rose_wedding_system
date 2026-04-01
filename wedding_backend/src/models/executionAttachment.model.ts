import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface ExecutionAttachmentAttributes {
  id: number;
  briefId: number;
  serviceDetailId?: number | null;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath: string;
  fileUrl?: string | null;
  label?: string | null;
  sortOrder: number;
  uploadedBy?: number | null;
}

type ExecutionAttachmentCreationAttributes = Optional<
  ExecutionAttachmentAttributes,
  | "id"
  | "serviceDetailId"
  | "size"
  | "fileUrl"
  | "label"
  | "sortOrder"
  | "uploadedBy"
>;

export class ExecutionAttachment
  extends Model<
    ExecutionAttachmentAttributes,
    ExecutionAttachmentCreationAttributes
  >
  implements ExecutionAttachmentAttributes
{
  public id!: number;
  public briefId!: number;
  public serviceDetailId?: number | null;
  public fileName!: string;
  public originalName!: string;
  public mimeType!: string;
  public size!: number;
  public filePath!: string;
  public fileUrl?: string | null;
  public label?: string | null;
  public sortOrder!: number;
  public uploadedBy?: number | null;
}

ExecutionAttachment.init(
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
    serviceDetailId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    fileUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    label: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    uploadedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "execution_attachments",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["briefId"] },
      { fields: ["serviceDetailId"] },
      { fields: ["mimeType"] },
      { fields: ["uploadedBy"] },
    ],
  },
);
