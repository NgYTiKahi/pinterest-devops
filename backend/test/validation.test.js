import test from "node:test";
import assert from "node:assert/strict";
import { validateImage, searchFilter } from "../src/validation.js";

test("normalizes whitespace and ignores client supplied DB operators", () => {
  assert.deepEqual(
    validateImage({
      title: "  Hà Nội  ",
      url: "https://example.com/a.jpg",
      description: " đẹp ",
      $set: { title: "bad" },
    }),
    { title: "Hà Nội", url: "https://example.com/a.jpg", description: "đẹp" },
  );
});
test("rejects empty title, oversized fields and non-object payload", () => {
  for (const data of [
    null,
    [],
    {},
    { title: " ", url: "https://a.test" },
    { title: "a".repeat(121), url: "https://a.test" },
    { title: "a", url: "https://a.test", description: "x".repeat(1001) },
  ])
    assert.throws(() => validateImage(data));
});
test("rejects executable, credentialed and arbitrary relative image URLs", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:image/svg+xml,x",
    "file:///etc/passwd",
    "/other.svg",
    "https://u:p@a.test/a",
  ])
    assert.throws(() => validateImage({ title: "a", url }));
});
test("allows bundled demo assets without external network", () => {
  assert.equal(
    validateImage({ title: "a", url: "/demo/mountains.svg" }).url,
    "/demo/mountains.svg",
  );
});
test("search treats regex metacharacters literally and rejects query objects", () => {
  const filter = searchFilter("a.*");
  assert.equal(filter.$or[0].title.$regex, "a\\.\\*");
  assert.deepEqual(searchFilter(""), {});
  assert.throws(() => searchFilter({ $ne: null }));
  assert.throws(() => searchFilter("x".repeat(101)));
});
