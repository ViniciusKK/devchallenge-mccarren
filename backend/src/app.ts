import cors from "cors";
import express from "express";
import morgan from "morgan";
import companyProfileRoutes from "./routes/companyProfileRoutes.js";
import { HttpError, isHttpError } from "./lib/httpError.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", companyProfileRoutes);

app.use((_req, _res, next) => {
  next(new HttpError(404, "Not Found"));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (isHttpError(error)) {
    return res.status(error.status).json({ error: error.message, details: error.details });
  }

  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
});

export default app;
