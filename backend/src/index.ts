import express from "express";
import cors from "cors";
import healthRouter from "./routes/health";
import voiceRouter from "./routes/voice";
import vaultSearchRouter from "./routes/vaultSearch";
import copilotRouter from "./routes/copilot";
import memoryRouter from "./routes/memory";
import actionsRouter from "./routes/actions";
import sessionRouter from "./routes/session";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "MUSE Backend",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/health",
      copilot: "/api/copilot",
      voice: "/api/voice",
      vault: "/api/vault-search",
      memory: "/api/memory",
      actions: "/api/actions",
      session: "/api/session"
    }
  });
});

app.use("/health", healthRouter);
app.use("/api/voice", voiceRouter);
app.use("/api/vault-search", vaultSearchRouter);
app.use("/api/copilot", copilotRouter);
app.use("/api/memory", memoryRouter);
app.use("/api/actions", actionsRouter);
app.use("/api/session", sessionRouter);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`MUSE backend listening on http://localhost:${PORT}`);
});
