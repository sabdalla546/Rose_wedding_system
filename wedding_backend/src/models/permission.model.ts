// src/models/permission.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface PermissionAttributes {
  id: number;
  code: string; // مثل "users.read" , "bookings.create"
  description?: string;
}

type PermissionCreationAttributes = Optional<
  PermissionAttributes,
  "id" | "description"
>;

export class Permission
  extends Model<PermissionAttributes, PermissionCreationAttributes>
  implements PermissionAttributes
{
  public id!: number;
  public code!: string;
  public description?: string;
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(150),
      unique: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
    },
  },
  {
    sequelize,
    tableName: "permissions",
    timestamps: true,
  }
);
