export class InputError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

export function validateImage(body) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new InputError("Dữ liệu không hợp lệ.");
  const { title, url, description = "" } = body;
  if (typeof title !== "string" || !title.trim() || title.trim().length > 120)
    throw new InputError("Tiêu đề cần từ 1 đến 120 ký tự.");
  if (typeof description !== "string" || description.length > 1000)
    throw new InputError("Mô tả tối đa 1000 ký tự.");
  if (typeof url !== "string" || url.length > 2048)
    throw new InputError("URL ảnh không hợp lệ.");
  const value = url.trim();
  if (!/^\/demo\/[a-z-]+\.svg$/.test(value)) {
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      throw new InputError("Dùng URL http/https hoặc ảnh mẫu.");
    }
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password
    )
      throw new InputError("URL ảnh không hợp lệ.");
  }
  return { title: title.trim(), url: value, description: description.trim() };
}

export function searchFilter(q = "") {
  if (typeof q !== "string" || q.length > 100)
    throw new InputError("Từ khóa tối đa 100 ký tự.");
  const literal = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return literal
    ? {
        $or: [
          { title: { $regex: literal, $options: "i" } },
          { description: { $regex: literal, $options: "i" } },
        ],
      }
    : {};
}
