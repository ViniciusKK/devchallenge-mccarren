import app from "./app.js";
import env from "./config/env.js";
import { initCompanyProfileRepository } from "./repositories/companyProfileRepository.js";

async function start(): Promise<void> {
  await initCompanyProfileRepository();

  app.listen(env.port, () => {
    console.log(`Server listening on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
