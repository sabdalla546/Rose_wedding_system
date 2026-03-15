import { Transaction } from "sequelize";
import { initDatabase, sequelize } from "../config/database";
import { Permission, Role, User } from "../models";
import { hashPassword } from "../utils/password";
import {
  buildPermissionDescription,
  scanRoutePermissions,
} from "./scanRoutePermissions";

type SeedRole = {
  name: string;
  description: string;
  permissionCodes: string[];
};

type SeedUser = {
  email: string;
  password: string;
  fullName: string;
  isActive: boolean;
  roleNames: string[];
};

const unique = (values: string[]) => [...new Set(values)].sort();

const buildSeedRoles = (permissionCodes: string[]): SeedRole[] => {
  const readPermissions = permissionCodes.filter((code) => code.endsWith(".read"));
  const userManagementPermissions = permissionCodes.filter((code) =>
    code.startsWith("users.")
  );

  return [
    {
      name: "admin",
      description: "Full access to all secured API routes",
      permissionCodes,
    },
    {
      name: "manager",
      description: "Operational access with full user management",
      permissionCodes: unique([
        ...readPermissions,
        ...userManagementPermissions,
      ]),
    },
    {
      name: "user",
      description: "Default application role for registered users",
      permissionCodes: [],
    },
  ];
};

const buildSeedUsers = (): SeedUser[] => [
  {
    email: process.env.SEED_ADMIN_EMAIL || "admin@wedding.local",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin@123456",
    fullName: process.env.SEED_ADMIN_NAME || "System Administrator",
    isActive: true,
    roleNames: ["admin"],
  },
  {
    email: process.env.SEED_MANAGER_EMAIL || "manager@wedding.local",
    password: process.env.SEED_MANAGER_PASSWORD || "Manager@123456",
    fullName: process.env.SEED_MANAGER_NAME || "Operations Manager",
    isActive: true,
    roleNames: ["manager"],
  },
  {
    email: process.env.SEED_USER_EMAIL || "user@wedding.local",
    password: process.env.SEED_USER_PASSWORD || "User@123456",
    fullName: process.env.SEED_USER_NAME || "Default User",
    isActive: true,
    roleNames: ["user"],
  },
];

const seedPermissions = async (
  permissionCodes: string[],
  transaction: Transaction
) => {
  for (const code of permissionCodes) {
    const description = buildPermissionDescription(code);

    const [permission, created] = await Permission.findOrCreate({
      transaction,
      where: { code },
      defaults: {
        code,
        description,
      },
    });

    if (!created && permission.description !== description) {
      await permission.update({ description }, { transaction });
    }
  }

  const permissions = await Permission.findAll({
    transaction,
    where: { code: permissionCodes },
    order: [["code", "ASC"]],
  });

  return new Map(permissions.map((permission) => [permission.code, permission]));
};

const seedRoles = async (
  rolesToSeed: SeedRole[],
  permissionMap: Map<string, Permission>,
  transaction: Transaction
) => {
  const roleMap = new Map<string, Role>();

  for (const roleData of rolesToSeed) {
    const [role, created] = await Role.findOrCreate({
      transaction,
      where: { name: roleData.name },
      defaults: {
        name: roleData.name,
        description: roleData.description,
      },
    });

    if (!created) {
      await role.update({ description: roleData.description }, { transaction });
    }

    const permissions = roleData.permissionCodes
      .map((code) => permissionMap.get(code))
      .filter((permission): permission is Permission => Boolean(permission));

    await (role as any).setPermissions(permissions, { transaction });
    roleMap.set(role.name, role);
  }

  return roleMap;
};

const seedUsers = async (
  usersToSeed: SeedUser[],
  roleMap: Map<string, Role>,
  transaction: Transaction
) => {
  for (const userData of usersToSeed) {
    const passwordHash = await hashPassword(userData.password);

    const [user, created] = await User.findOrCreate({
      transaction,
      where: { email: userData.email },
      defaults: {
        email: userData.email,
        password: passwordHash,
        fullName: userData.fullName,
        isActive: userData.isActive,
      },
    });

    if (!created) {
      await user.update({
        fullName: userData.fullName,
        isActive: userData.isActive,
      }, { transaction });
    }

    const roles = userData.roleNames
      .map((roleName) => roleMap.get(roleName))
      .filter((role): role is Role => Boolean(role));

    await (user as any).setRoles(roles, { transaction });
  }
};

const seedRbac = async () => {
  await initDatabase();

  const permissionCodes = scanRoutePermissions();

  if (permissionCodes.length === 0) {
    throw new Error("No permissions found in src/routes");
  }

  await sequelize.transaction(async (transaction) => {
    const permissionMap = await seedPermissions(permissionCodes, transaction);
    const roleMap = await seedRoles(
      buildSeedRoles(permissionCodes),
      permissionMap,
      transaction
    );
    await seedUsers(buildSeedUsers(), roleMap, transaction);
  });

  console.log(
    `Seed completed. Permissions: ${permissionCodes.length}, roles: 3, users: 3`
  );
};

seedRbac()
  .then(async () => {
    await sequelize.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("RBAC seed failed:", error);
    await sequelize.close();
    process.exit(1);
  });
