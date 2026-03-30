// src/config/database.ts
import { Sequelize } from "sequelize";
import { env } from "./env";
import { logger } from "./logger";

export const sequelize = new Sequelize(
  env.db.name,
  env.db.user,
  env.db.password,
  {
    host: env.db.host,
    port: env.db.port,
    dialect: "mysql",
    logging: (msg) => logger.debug(msg),
  },
);

export const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info("âœ… Database connected successfully");
    await sequelize.sync({
      alter: env.dbSync.alter,
      force: env.dbSync.force,
    });
    logger.info("âœ… Models synced");
    const { syncVendorTypesCatalog } = await import(
      "../seed/syncVendorTypesCatalog"
    );
    await syncVendorTypesCatalog();
    logger.info("âœ… Vendor types catalog synced");
  } catch (err) {
    logger.error("âŒ Unable to connect to DB", err);
    process.exit(1);
  }
};
