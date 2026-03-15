// src/models/userRole.model.ts
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class UserRole extends Model {}

UserRole.init(
  {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
    roleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
  },
  {
    sequelize,
    tableName: "user_roles",
    timestamps: false,
  }
);
