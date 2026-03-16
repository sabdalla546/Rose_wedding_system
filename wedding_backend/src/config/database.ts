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
    logger.info("✅ Database connected successfully");
    await sequelize.sync({ alter: true }); // أثناء التطوير ممكن تخليها true
    logger.info("✅ Models synced");
  } catch (err) {
    logger.error("❌ Unable to connect to DB", err);
    process.exit(1);
  }
};
