// src/models/role.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface RoleAttributes {
  id: number;
  name: string; // "admin", "manager", "cashier", ...
  description?: string;
}

type RoleCreationAttributes = Optional<RoleAttributes, "id" | "description">;

export class Role
  extends Model<RoleAttributes, RoleCreationAttributes>
  implements RoleAttributes
{
  public id!: number;
  public name!: string;
  public description?: string;
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
    },
  },
  {
    sequelize,
    tableName: "roles",
    timestamps: true,
  }
);
