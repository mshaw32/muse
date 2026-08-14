import express from "express";
import cors from "cors";
import healthRouter from "./routes/health";
import voiceRouter from "./routes/voice";
import vaultSearchRouter from "./routes/vaultSearch";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/voice", voiceRouter);
app.use("/api/vault-search", vaultSearchRouter);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`MUSE backend listening on http://localhost:${PORT}`);
});
