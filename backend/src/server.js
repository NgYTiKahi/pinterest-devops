import mongoose from "mongoose";
import { createApp } from "./app.js";
if (!process.env.MONGODB_URI)
  throw new Error("Thiếu MONGODB_URI. Xem backend/.env.example.");
await mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
});
const port = Number(process.env.PORT || 8088);
const server = createApp().listen(port, "0.0.0.0", () =>
  console.log(JSON.stringify({ level: "info", message: "API ready", port })),
);
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  const timeout = setTimeout(() => process.exit(1), 10000).unref();
  server.close(async () => {
    await mongoose.disconnect();
    clearTimeout(timeout);
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
