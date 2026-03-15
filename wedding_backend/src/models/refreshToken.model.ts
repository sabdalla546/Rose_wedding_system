// src/models/refreshToken.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface RefreshTokenAttributes {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  revoked: boolean;
  replacedByToken?: string | null;
}

type RefreshTokenCreationAttributes = Optional<
  RefreshTokenAttributes,
  "id" | "revoked" | "replacedByToken"
>;

export class RefreshToken
  extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>
  implements RefreshTokenAttributes
{
  public id!: number;
  public userId!: number;
  public token!: string;
  public expiresAt!: Date;
  public revoked!: boolean;
  public replacedByToken?: string | null;
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    replacedByToken: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "refresh_tokens",
    timestamps: true,
  }
);
