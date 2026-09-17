import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import {
  Registry,
  Counter,
  Histogram,
  collectDefaultMetrics,
} from "prom-client";
import { Image } from "./model.js";
import { InputError, validateImage, searchFilter } from "./validation.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("query parser", "extended");
  app.use(helmet());
  const origins = (
    process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173"
  ).split(",");
  app.use(cors({ origin: origins }));
  app.use(express.json({ limit: "32kb" }));
  const registry = new Registry();
  collectDefaultMetrics({ register: registry });
  const requests = new Counter({
    name: "http_requests_total",
    help: "HTTP requests",
    labelNames: ["method", "route", "status"],
    registers: [registry],
  });
  const duration = new Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP latency",
    labelNames: ["method", "route"],
    registers: [registry],
    buckets: [0.01, 0.05, 0.1, 0.3, 1, 3],
  });
  app.use((req, res, next) => {
    const start = performance.now();
    res.on("finish", () => {
      if (req.path === "/metrics") return;
      const route = req.route?.path || "unmatched";
      requests.inc({
        method: req.method,
        route,
        status: String(res.statusCode),
      });
      duration.observe(
        { method: req.method, route },
        (performance.now() - start) / 1000,
      );
    });
    next();
  });
  app.get("/metrics", async (_req, res) =>
    res.type(registry.contentType).send(await registry.metrics()),
  );
  app.get("/api/health/live", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/health/ready", async (_req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) throw new Error("disconnected");
      await mongoose.connection.db
        .admin()
        .command({ ping: 1 }, { timeoutMS: 2000 });
      res.json({ status: "ok", database: "up" });
    } catch {
      res.status(503).json({ status: "unavailable", database: "down" });
    }
  });
  app.get("/api/images", async (req, res) => {
    const data = await Image.find(searchFilter(req.query.q))
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json({ success: true, data });
  });
  app.post("/api/images", async (req, res) => {
    const data = await Image.create(validateImage(req.body));
    res.status(201).json({ success: true, data });
  });
  app.param("id", (req, _res, next, id) => {
    if (!/^[a-f\d]{24}$/i.test(id))
      return next(new InputError("ID ảnh không hợp lệ."));
    next();
  });
  app.get("/api/images/:id", async (req, res) => {
    const data = await Image.findById(req.params.id).lean();
    if (!data) return res.status(404).json({ message: "Không tìm thấy ảnh." });
    res.json({ success: true, data });
  });
  app.put("/api/images/:id", async (req, res) => {
    const data = await Image.findByIdAndUpdate(
      req.params.id,
      { $set: validateImage(req.body) },
      { returnDocument: "after", runValidators: true },
    );
    if (!data) return res.status(404).json({ message: "Không tìm thấy ảnh." });
    res.json({ success: true, data });
  });
  app.delete("/api/images/:id", async (req, res) => {
    if (!(await Image.findByIdAndDelete(req.params.id)))
      return res.status(404).json({ message: "Không tìm thấy ảnh." });
    res.status(204).end();
  });
  app.use((_req, res) =>
    res.status(404).json({ message: "Không tìm thấy endpoint." }),
  );
  app.use((err, _req, res, _next) => {
    const status =
      err.status && err.status >= 400 && err.status < 500 ? err.status : 500;
    if (status === 500)
      console.error(
        JSON.stringify({
          level: "error",
          message: "Request failed",
          type: err.name,
        }),
      );
    res
      .status(status)
      .json({
        success: false,
        message:
          status === 500 ? "Có lỗi máy chủ. Vui lòng thử lại." : err.message,
      });
  });
  return app;
}
