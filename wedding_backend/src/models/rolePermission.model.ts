// src/models/rolePermission.model.ts
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class RolePermission extends Model {}

RolePermission.init(
  {
    roleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
    permissionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
  },
  {
    sequelize,
    tableName: "role_permissions",
    timestamps: false,
  }
);
