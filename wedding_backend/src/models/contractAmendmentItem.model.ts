import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type ContractAmendmentItemChangeType = "add_service" | "remove_service";

export type ContractAmendmentItemStatus = "pending" | "applied" | "cancelled";

export interface ContractAmendmentItemAttributes {
  id: number;
  amendmentId: number;
  changeType: ContractAmendmentItemChangeType;

  targetContractItemId?: number | null;
  targetEventServiceId?: number | null;
  targetExecutionServiceDetailId?: number | null;

  serviceId?: number | null;
  itemName?: string | null;
  category?: string | null;
  quantity?: number | string | null;
  unitPrice?: number | string | null;
  totalPrice?: number | string | null;
  notes?: string | null;

  sortOrder: number;
  status: ContractAmendmentItemStatus;

  createdBy?: number | null;
  updatedBy?: number | null;
}

type ContractAmendmentItemCreationAttributes = Optional<
  ContractAmendmentItemAttributes,
  | "id"
  | "targetContractItemId"
  | "targetEventServiceId"
  | "targetExecutionServiceDetailId"
  | "serviceId"
  | "itemName"
  | "category"
  | "quantity"
  | "unitPrice"
  | "totalPrice"
  | "notes"
  | "sortOrder"
  | "status"
  | "createdBy"
  | "updatedBy"
>;

export class ContractAmendmentItem
  extends Model<
    ContractAmendmentItemAttributes,
    ContractAmendmentItemCreationAttributes
  >
  implements ContractAmendmentItemAttributes
{
  public id!: number;
  public amendmentId!: number;
  public changeType!: ContractAmendmentItemChangeType;

  public targetContractItemId?: number | null;
  public targetEventServiceId?: number | null;
  public targetExecutionServiceDetailId?: number | null;

  public serviceId?: number | null;
  public itemName?: string | null;
  public category?: string | null;
  public quantity?: number | string | null;
  public unitPrice?: number | string | null;
  public totalPrice?: number | string | null;
  public notes?: string | null;

  public sortOrder!: number;
  public status!: ContractAmendmentItemStatus;

  public createdBy?: number | null;
  public updatedBy?: number | null;
}

ContractAmendmentItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    amendmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    changeType: {
      type: DataTypes.ENUM("add_service", "remove_service"),
      allowNull: false,
    },

    targetContractItemId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    targetEventServiceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    targetExecutionServiceDetailId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    serviceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    itemName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true,
    },

    unitPrice: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true,
    },

    totalPrice: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true,
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

    status: {
      type: DataTypes.ENUM("pending", "applied", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
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
    tableName: "contract_amendment_items",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["amendmentId"] },
      { fields: ["changeType"] },
      { fields: ["status"] },
      { fields: ["targetContractItemId"] },
      { fields: ["targetEventServiceId"] },
      { fields: ["targetExecutionServiceDetailId"] },
      { fields: ["serviceId"] },
    ],
  },
);
