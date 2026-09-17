# Báo cáo kiểm thử — 17/09/2026

Đây là kết quả thực chạy trong phiên chuẩn bị source, không phải kết quả giả định.
Không tạo tài nguyên AWS, không deploy VPS, không đăng ký runner hay chạy pipeline
trên tài khoản GitHub/Jenkins của người dùng.

## Đã đạt

| Kiểm tra | Kết quả và phạm vi |
|---|---|
| Backend validation | 5/5 tests đạt: chuẩn hóa dữ liệu, giới hạn độ dài, loại URL nguy hiểm, ảnh mẫu, search literal |
| API integration | 4/4 tests đạt trên MongoDB 8.0.15 thật: CRUD/search, lỗi input/ID, metrics, readiness khi DB disconnect |
| Seed idempotence | Chạy hai lần; collection còn đúng 8 ảnh mẫu |
| Frontend build | `npm run build` thành công trên Node 24.11.0, Vite 8.3.0 |
| Browser end-to-end | Edge headless: 8 ảnh mẫu → thêm → tìm kiếm → sửa → reload vẫn còn → xóa |
| Responsive | Viewport 1440×1100 và 390×844; không tràn ngang mobile; không có JavaScript page errors |
| Dependency audit | Backend production dependencies và toàn bộ frontend dependencies: 0 vulnerabilities tại thời điểm kiểm tra |
| Compose | Base, dev override, Jenkins controller/DinD, Jenkins app override đều parse/config hợp lệ |
| YAML/JSON | 17 file cấu hình/package/dashboard parse thành công; kiểm tra lockfiles dùng public npm registry |
| PowerShell | Đã sửa lỗi UTF-8 không BOM trên Windows PowerShell 5.1 sau phản hồi người dùng; thông báo trong .ps1 dùng ASCII, kiểm tra lại bằng powershell.exe 5.1 |
| Bash | `bash -n` cho start.sh và deploy-vps.sh đạt |
| Terraform format | `terraform fmt -check` đạt với Terraform 1.13.3 |
| Container tags | 9 image tags runtime/Jenkins được kiểm tra manifest tồn tại trên Docker Hub |
| Review | Đã sửa auto-deploy để chờ CI thành công và checkout đúng SHA; sửa nhãn network metric cho đúng namespace |

Ảnh giao diện trong `screenshots/desktop.png` và `screenshots/mobile.png` được chụp
trong kiểm thử browser thật. Môi trường kiểm thử là **React/Vite + Express chạy
native, MongoDB thật dạng tiến trình tạm**, không phải ảnh chụp stack Docker.
Tiến trình test và database tạm đã được dừng sau khi kiểm thử.

## Chưa xác minh runtime trong phiên này

| Phần | Lý do / cách kiểm tra tiếp |
|---|---|
| Docker image builds và toàn stack Compose | Docker CLI có sẵn, nhưng sandbox bị `permission denied` khi kết nối named pipe Docker Engine; chạy scripts/start.ps1 trong PowerShell thường |
| Nginx trong container, 4 monitoring targets và dashboard có dữ liệu | Phải có stack Docker đang chạy; scripts/verify.ps1 kiểm tra các mục này |
| Prometheus rule/config bằng promtool | YAML đã parse; promtool được kiểm tra trong scripts/verify.ps1 và CI, chưa chạy tại phiên này |
| Terraform provider/schema validation | `init -backend=false` tải provider nhưng không thể đọc file tạm để tính checksum do Access denied; chưa tuyên bố validate đạt. CI có job init/validate trên Linux |
| Ansible syntax-check / remote deployment | YAML đã parse; chưa có Ansible Linux hoặc quyền Docker. Có image và lệnh syntax-check trong docs/VPS.md và CI |
| Jenkins pipeline runtime / GitHub workflow run | Đã chuẩn bị code và Compose hợp lệ; chưa cấu hình repository/runner/controller thực tế |
| AWS EC2 | Theo yêu cầu chỉ chạy local: không plan/apply hoặc dùng AWS credentials |

Các kết quả build/test ứng dụng không thay thế cho kiểm chứng container runtime.
Để có bằng chứng nộp bài phần Docker/monitoring/CI, hãy chạy các lệnh trong README
và chụp màn hình theo docs/DEMO.md sau khi các bước thực sự thành công.

## Lệnh tái kiểm tra

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1
```

Unit test nằm trong `backend/test/validation.test.js`. Integration test nằm trong
`backend/test/integration.test.js`, chạy với `TEST_MONGODB_URI` trỏ tới database
tạm; GitHub CI cung cấp MongoDB service cho việc này.
