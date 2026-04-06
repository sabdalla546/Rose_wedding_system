import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface VenueSpecifications {
  hall?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
    sideCoveringPolicy?: "allowed" | "not_allowed" | null;
  } | null;
  kosha?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
    pieceCount?: number | null;
    frameCount?: number | null;
    stairsCount?: number | null;
    stairLength?: number | null;
    hasStage?: boolean;
    stage?: {
      length?: number | null;
      width?: number | null;
      height?: number | null;
    } | null;
  } | null;
  gate?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
    pieceCount?: number | null;
  } | null;
  door?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
  } | null;
  entrances?: Array<{
    name?: string | null;
    length?: number | null;
    width?: number | null;
    height?: number | null;
    pieceCount?: number | null;
  }> | null;
  buffet?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
  } | null;
  sides?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
    pieceCount?: number | null;
  } | null;
  lighting?: {
    hasHangingSupport?: boolean;
    hangingLength?: number | null;
    hangingWidth?: number | null;
  } | null;
  hotelBleachers?: {
    available?: boolean;
  } | null;
}

export interface VenueAttributes {
  id: number;
  name: string;
  city?: string | null;
  area?: string | null;
  address?: string | null;
  phone?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
  isActive: boolean;
  specificationsJson?: VenueSpecifications | null;
}

type VenueCreationAttributes = Optional<
  VenueAttributes,
  | "id"
  | "city"
  | "area"
  | "address"
  | "phone"
  | "contactPerson"
  | "notes"
  | "isActive"
  | "specificationsJson"
>;

export class Venue
  extends Model<VenueAttributes, VenueCreationAttributes>
  implements VenueAttributes
{
  public id!: number;
  public name!: string;
  public city?: string | null;
  public area?: string | null;
  public address?: string | null;
  public phone?: string | null;
  public contactPerson?: string | null;
  public notes?: string | null;
  public isActive!: boolean;
  public specificationsJson?: VenueSpecifications | null;
}

Venue.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },

    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    area: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    contactPerson: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    specificationsJson: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "venues",
    timestamps: true,
    paranoid: true,
  },
);
