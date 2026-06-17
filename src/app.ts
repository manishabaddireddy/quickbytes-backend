import express from "express";
import cors from "cors";
import router from "./routes";

const app = express();

app.use(cors({
  origin: "http://localhost:5173", // your frontend URL (Vite default)
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", router);

export default app;
