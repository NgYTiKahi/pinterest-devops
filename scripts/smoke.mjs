import assert from "node:assert/strict";
const base = (process.argv[2] || "http://127.0.0.1:8080").replace(/\/$/, "");
async function request(path, method = "GET", body) {
  return fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  });
}
assert.equal(
  (await request("/api/health/ready")).status,
  200,
  "MongoDB readiness",
);
const html = await (await request("/")).text();
assert.match(html, /<div id="root">/, "React document");
const created = await request("/api/images", "POST", {
  title: "Smoke " + Date.now(),
  url: "/demo/mountains.svg",
  description: "Temporary smoke test",
});
assert.equal(created.status, 201);
const image = (await created.json()).data;
try {
  const list = await (
    await request("/api/images?q=" + encodeURIComponent(image.title))
  ).json();
  assert.ok(
    list.data.some((x) => x._id === image._id),
    "created image searchable",
  );
  const updated = await request(`/api/images/${image._id}`, "PUT", {
    title: "Smoke edited",
    url: "/demo/forest.svg",
  });
  assert.equal(updated.status, 200);
  const loaded = await (await request(`/api/images/${image._id}`)).json();
  assert.equal(loaded.data.title, "Smoke edited");
  assert.equal(
    (
      await request("/api/images", "POST", {
        title: "bad",
        url: "javascript:x",
      })
    ).status,
    400,
  );
} finally {
  assert.equal(
    (await request(`/api/images/${image._id}`, "DELETE")).status,
    204,
  );
}
assert.equal((await request(`/api/images/${image._id}`)).status, 404);
console.log(
  "PASS: frontend → proxy → API → MongoDB, CRUD, search, validation, cleanup.",
);
