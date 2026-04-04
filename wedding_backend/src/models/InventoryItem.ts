import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface InventoryItemAttributes {
  id: number;
  name: string;
  quantity: number;
  imagePath?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}

type InventoryItemCreationAttributes = Optional<
  InventoryItemAttributes,
  "id" | "quantity" | "imagePath" | "createdBy" | "updatedBy"
>;

export class InventoryItem
  extends Model<InventoryItemAttributes, InventoryItemCreationAttributes>
  implements InventoryItemAttributes
{
  public id!: number;
  public name!: string;
  public quantity!: number;
  public imagePath?: string | null;
  public createdBy?: number | null;
  public updatedBy?: number | null;
}

InventoryItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    imagePath: {
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
    tableName: "inventory_items",
    timestamps: true,
    indexes: [
      { fields: ["name"] },
      { fields: ["quantity"] },
      { fields: ["createdBy"] },
      { fields: ["updatedBy"] },
    ],
  },
);
