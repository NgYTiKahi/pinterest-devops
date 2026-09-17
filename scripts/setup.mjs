import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");
if (!existsSync(envPath)) {
  let content = readFileSync(resolve(root, ".env.example"), "utf8");
  for (const key of ["ROOT", "APP", "EXPORTER", "GRAFANA"])
    content = content.replace(
      `CHANGE_ME_${key}`,
      randomBytes(24).toString("hex"),
    );
  writeFileSync(envPath, content, { mode: 0o600, flag: "wx" });
  console.log("Đã tạo .env với mật khẩu ngẫu nhiên. Không commit file này.");
} else console.log("Giữ nguyên .env đã có.");
if (process.argv.includes("--local")) {
  const env = Object.fromEntries(
    readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .filter((x) => x && !x.startsWith("#"))
      .map((x) => {
        const i = x.indexOf("=");
        return [x.slice(0, i), x.slice(i + 1)];
      }),
  );
  const backendEnv = resolve(root, "backend/.env");
  if (!existsSync(backendEnv))
    writeFileSync(
      backendEnv,
      `PORT=8088\nMONGODB_URI=mongodb://pins:${encodeURIComponent(env.MONGO_APP_PASSWORD)}@127.0.0.1:27017/pins?authSource=pins\nCORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173\n`,
      { mode: 0o600, flag: "wx" },
    );
  const frontendEnv = resolve(root, "frontend/.env");
  if (!existsSync(frontendEnv))
    writeFileSync(
      frontendEnv,
      readFileSync(resolve(root, "frontend/.env.example")),
      { flag: "wx" },
    );
  console.log("Đã chuẩn bị env cho chế độ Localhost.");
}
