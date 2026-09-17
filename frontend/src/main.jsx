import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./api";
import "./style.css";

const blank = { title: "", url: "", description: "" };
function Icon({ name, ...props }) {
  const paths = {
    plus: "M12 5v14M5 12h14",
    search: "m21 21-4.3-4.3M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0",
    arrow: "M7 17 17 7M7 7h10v10",
    close: "m6 6 12 12M6 18 18 6",
    edit: "m16 3 5 5-12 12-6 1 1-6ZM14 5l5 5",
    trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
function App() {
  const [images, setImages] = useState([]),
    [query, setQuery] = useState(""),
    [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null),
    [form, setForm] = useState(blank),
    [saving, setSaving] = useState(false),
    [formError, setFormError] = useState("");
  const dialog = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/images", {
          params: { q: query },
          signal: controller.signal,
        });
        setImages(data.data);
      } catch (e) {
        if (!controller.signal.aborted)
          setError(
            e.response?.data?.message ||
              "Chưa kết nối được API. Kiểm tra backend và MongoDB rồi thử lại.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, reload]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  function openEditor(image) {
    setEditing(image || null);
    setForm(
      image
        ? { title: image.title, url: image.url, description: image.description }
        : blank,
    );
    setFormError("");
    dialog.current.showModal();
  }
  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editing) await api.put(`/images/${editing._id}`, form);
      else await api.post("/images", form);
      dialog.current.close();
      setNotice(editing ? "Đã cập nhật ý tưởng." : "Đã thêm ý tưởng mới.");
      setReload((x) => x + 1);
    } catch (e) {
      setFormError(
        e.response?.data?.message || "Không lưu được ảnh. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function remove(image) {
    if (!window.confirm(`Xóa “${image.title}” khỏi bảng cảm hứng?`)) return;
    try {
      await api.delete(`/images/${image._id}`);
      setReload((x) => x + 1);
      setNotice("Đã xóa ảnh.");
    } catch {
      setError("Không xóa được ảnh. Vui lòng thử lại.");
    }
  }
  return (
    <>
      <header className="header">
        <a className="brand" href="/" aria-label="Pins trang chủ">
          <span className="brand-mark">p.</span>
          <span>
            pins<span className="brand-dot">.</span>
          </span>
        </a>
        <span className="header-label">KHÔNG GIAN CHO Ý TƯỞNG</span>
        <button className="button small" onClick={() => openEditor()}>
          <Icon name="plus" /> Thêm ảnh
        </button>
      </header>
      <main>
        <section className="hero">
          <div className="eyebrow">
            <span /> BẢNG CẢM HỨNG CỦA BẠN
          </div>
          <h1>
            Những điều nhỏ.
            <br />
            <span>Cảm hứng lớn.</span>
          </h1>
          <div className="hero-bottom">
            <p>
              Gom những hình ảnh bạn yêu.
              <br />
              Để ý tưởng tiếp theo bắt đầu từ đây.
            </p>
            <span className="hero-note">
              TÌM THẤY · LƯU LẠI · SÁNG TẠO <Icon name="arrow" />
            </span>
          </div>
          <div className="hero-shape" aria-hidden="true">
            ✳
          </div>
        </section>
        <section className="collection" aria-label="Bộ sưu tập ảnh">
          <div className="toolbar">
            <div className="collection-title">
              <h2>Góc cảm hứng</h2>
              <span className="count">{images.length}</span>
            </div>
            <label className="search">
              <Icon name="search" />
              <input
                aria-label="Tìm kiếm ảnh"
                maxLength="100"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm một chút cảm hứng…"
              />
              {query && (
                <button aria-label="Xóa tìm kiếm" onClick={() => setQuery("")}>
                  <Icon name="close" />
                </button>
              )}
            </label>
          </div>
          {error ? (
            <div className="state error" role="alert">
              <h3>Kết nối đang gián đoạn</h3>
              <p>{error}</p>
              <button
                className="button"
                onClick={() => setReload((x) => x + 1)}
              >
                Thử lại
              </button>
            </div>
          ) : loading ? (
            <div className="grid" aria-label="Đang tải ảnh" aria-busy="true">
              {[1, 2, 3, 4].map((n) => (
                <div className="skeleton" key={n} />
              ))}
            </div>
          ) : !images.length ? (
            <div className="state">
              <span className="empty-symbol">✳</span>
              <h3>
                {query
                  ? "Chưa tìm thấy ảnh phù hợp"
                  : "Một khoảng trống cho ý tưởng mới"}
              </h3>
              <p>
                {query
                  ? "Thử một từ khóa khác nhé."
                  : "Thêm ảnh đầu tiên hoặc chạy lệnh tạo dữ liệu mẫu trong hướng dẫn."}
              </p>
              <button className="button" onClick={() => openEditor()}>
                <Icon name="plus" />
                Thêm ảnh
              </button>
            </div>
          ) : (
            <div className="grid">
              {images.map((image, i) => (
                <article className="pin" key={image._id}>
                  <div className={"image-wrap shape-" + (i % 4)}>
                    <img
                      src={image.url}
                      alt={image.title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/demo/unavailable.svg";
                      }}
                    />
                    <div className="card-actions">
                      <button
                        aria-label={"Sửa " + image.title}
                        onClick={() => openEditor(image)}
                      >
                        <Icon name="edit" />
                      </button>
                      <button
                        aria-label={"Xóa " + image.title}
                        onClick={() => remove(image)}
                      >
                        <Icon name="trash" />
                      </button>
                    </div>
                    <span className="pin-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="pin-meta">
                    <h3>{image.title}</h3>
                    <p>
                      {image.description ||
                        "Một ý tưởng đang chờ được khám phá."}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <footer>
          <a className="brand footer-brand" href="/">
            pins.
          </a>
          <span>MỘT NƠI NHỎ CHO NHỮNG Ý TƯỞNG LỚN.</span>
          <span>MADE TO INSPIRE ↗</span>
        </footer>
      </main>
      <dialog
        ref={dialog}
        onCancel={(e) => {
          if (saving) e.preventDefault();
        }}
      >
        <form onSubmit={save}>
          <div className="modal-heading">
            <div>
              <span className="eyebrow">THÊM VÀO BỘ SƯU TẬP</span>
              <h2>{editing ? "Chỉnh sửa ý tưởng" : "Một cảm hứng mới"}</h2>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Đóng"
              disabled={saving}
              onClick={() => dialog.current.close()}
            >
              <Icon name="close" />
            </button>
          </div>
          <label>
            Tiêu đề
            <input
              autoFocus
              required
              maxLength="120"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Đặt tên cho cảm hứng của bạn"
            />
          </label>
          <label>
            Đường dẫn ảnh
            <input
              required
              maxLength="2048"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://… hoặc /demo/mountains.svg"
            />
          </label>
          <p className="hint">
            Dùng URL ảnh http/https hoặc chọn ảnh mẫu bên dưới.
          </p>
          <div className="demo-options">
            {["mountains", "forest", "sunset", "ocean"].map((name) => (
              <button
                key={name}
                type="button"
                aria-label={"Chọn ảnh mẫu " + name}
                onClick={() => setForm({ ...form, url: `/demo/${name}.svg` })}
              >
                <img src={`/demo/${name}.svg`} alt={name} />
              </button>
            ))}
          </div>
          <label>
            Mô tả
            <textarea
              rows="3"
              maxLength="1000"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Điều gì khiến bạn yêu hình ảnh này?"
            />
          </label>
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
          <div className="form-footer">
            <button
              type="button"
              className="button secondary"
              disabled={saving}
              onClick={() => dialog.current.close()}
            >
              Hủy
            </button>
            <button className="button" disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu ý tưởng"}
              <Icon name="arrow" />
            </button>
          </div>
        </form>
      </dialog>
      {notice && (
        <div className="toast" role="status">
          ✓ {notice}
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
