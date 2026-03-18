import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface ContractItemAttributes {
  id: number;
  contractId: number;

  quotationItemId?: number | null;
  eventServiceId?: number | null;
  serviceId?: number | null;

  itemName: string;
  category?: string | null;

  quantity: number;
  unitPrice: number;
  totalPrice: number;

  notes?: string | null;
  sortOrder: number;

  createdBy?: number | null;
  updatedBy?: number | null;
}

type ContractItemCreationAttributes = Optional<
  ContractItemAttributes,
  | "id"
  | "quotationItemId"
  | "eventServiceId"
  | "serviceId"
  | "category"
  | "notes"
  | "sortOrder"
  | "createdBy"
  | "updatedBy"
>;

export class ContractItem
  extends Model<ContractItemAttributes, ContractItemCreationAttributes>
  implements ContractItemAttributes
{
  public id!: number;
  public contractId!: number;

  public quotationItemId?: number | null;
  public eventServiceId?: number | null;
  public serviceId?: number | null;

  public itemName!: string;
  public category?: string | null;

  public quantity!: number;
  public unitPrice!: number;
  public totalPrice!: number;

  public notes?: string | null;
  public sortOrder!: number;

  public createdBy?: number | null;
  public updatedBy?: number | null;
}

ContractItem.init(
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

    quotationItemId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    eventServiceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    serviceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    itemName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 1,
    },

    unitPrice: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },

    totalPrice: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
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
    tableName: "contract_items",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["contractId"] },
      { fields: ["quotationItemId"] },
      { fields: ["eventServiceId"] },
      { fields: ["serviceId"] },
      { fields: ["category"] },
      { fields: ["sortOrder"] },
    ],
  },
);
