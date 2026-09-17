import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";

let server, base;
before(async () => {
  if (!process.env.TEST_MONGODB_URI)
    throw new Error("Set TEST_MONGODB_URI to a disposable test database.");
  await mongoose.connect(process.env.TEST_MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  server = createApp().listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
});
async function call(path, method = "GET", body) {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: res.status,
    body: res.status === 204 ? null : await res.json(),
  };
}
test("CRUD persists and searches literal text, returns 404 after delete", async () => {
  const created = await call("/api/images", "POST", {
    title: "integration a.*",
    url: "/demo/mountains.svg",
    description: "test",
  });
  assert.equal(created.status, 201);
  const id = created.body.data._id;
  try {
    const found = await call("/api/images?q=a.*");
    assert.ok(found.body.data.some((x) => x._id === id));
    const updated = await call(`/api/images/${id}`, "PUT", {
      title: "Updated",
      url: "/demo/forest.svg",
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.title, "Updated");
    assert.equal((await call(`/api/images/${id}`)).body.data.title, "Updated");
  } finally {
    assert.equal((await call(`/api/images/${id}`, "DELETE")).status, 204);
  }
  assert.equal((await call(`/api/images/${id}`)).status, 404);
});
test("invalid bodies and IDs return client errors without leaking internals", async () => {
  assert.equal(
    (
      await call("/api/images", "POST", {
        title: "a",
        url: "javascript:alert(1)",
      })
    ).status,
    400,
  );
  assert.equal((await call("/api/images/bad-id")).status, 400);
  assert.equal((await call("/api/images?q[$ne]=x")).status, 400);
});
test("readiness checks MongoDB and metrics expose low cardinality routes", async () => {
  assert.equal((await call("/api/health/ready")).status, 200);
  await call("/api/images/not-an-id");
  const metrics = await (await fetch(base + "/metrics")).text();
  assert.match(metrics, /http_requests_total/);
  assert.doesNotMatch(metrics, /route="\/api\/images\/not-an-id"/);
});
test("readiness returns 503 when database is disconnected while liveness stays 200", async () => {
  await mongoose.disconnect();
  try {
    assert.equal((await call("/api/health/ready")).status, 503);
    assert.equal((await call("/api/health/live")).status, 200);
  } finally {
    await mongoose.connect(process.env.TEST_MONGODB_URI);
  }
});
