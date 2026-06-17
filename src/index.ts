import app from "./app";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT ?? 3000;

app.listen(Number(PORT), () => {
  console.log(`QuickBytes API running on http://localhost:${PORT}`);
});