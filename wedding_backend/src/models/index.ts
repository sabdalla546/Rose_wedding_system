// src/models/index.ts
import { sequelize } from "../config/database";
import { User } from "./user.model";
import { Role } from "./role.model";
import { Permission } from "./permission.model";
import { UserRole } from "./userRole.model";
import { RolePermission } from "./rolePermission.model";
import { RefreshToken } from "./refreshToken.model";

// علاقات
User.belongsToMany(Role, { through: UserRole, foreignKey: "userId" });
Role.belongsToMany(User, { through: UserRole, foreignKey: "roleId" });

Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: "roleId",
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: "permissionId",
});

RefreshToken.belongsTo(User, { foreignKey: "userId" });
User.hasMany(RefreshToken, { foreignKey: "userId" });

export {
  sequelize,
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  RefreshToken,
};
