// src/server.ts
import { createApp } from "./app";
import { env } from "./config/env";
import { initDatabase } from "./config/database";
import { logger } from "./config/logger";
import "./models"; // لتهيئة العلاقات

const start = async () => {
  await initDatabase();

  const app = await createApp();

  app.listen(env.port, () => {
    logger.info(`🚀 Server running on http://localhost:${env.port}`);
  });
};

start();
