# Kịch bản demo và ma trận yêu cầu

## Demo 10–15 phút tại local

1. Mở Docker Desktop, chạy `scripts/start.ps1`; xem 7 services trong `docker compose ps`.
2. Mở localhost:8080, xem ảnh mẫu và responsive layout.
3. Thêm ảnh với `/demo/forest.svg`, tìm kiếm tiêu đề, chỉnh sửa mô tả, tải lại trang
   để chứng minh dữ liệu được lưu; xóa bản ghi vừa tạo.
4. Mở `frontend/src/api.js`, `vite.config.js`, `nginx.conf`; giải thích `/api` và proxy.
5. Mở backend env example và Compose (không trình chiếu password thật), giải thích
   `127.0.0.1` ngoài Docker và `mongodb` bên trong Docker.
6. Mở Grafana dashboard và Prometheus targets: bốn target UP, `mongodb_up=1`.
7. Gọi API nhiều lần để thấy request rate. Dừng DB bằng `docker compose stop mongodb`,
   chờ ít nhất 60–90 giây: readiness trả 503, exporter báo DB down hoặc scrape fail.
   Chạy `docker compose start mongodb`, chờ target/health phục hồi. Không xóa volume.
8. Chạy `scripts/verify.ps1` để kiểm chứng CRUD và monitoring sau khi phục hồi.
9. Trình bày GitHub workflows và Jenkins pipeline. Nếu đã cấu hình Jenkins,
   Build Now rồi mở localhost:8081 để xem app do pipeline deploy.
10. Mở Terraform và Ansible, trình bày cấu trúc và syntax/validate. Nêu rõ không
    thuê VPS; không trình bày kết quả apply/deploy cloud như thể đã chạy thực tế.

## Đối chiếu đề bài

| Yêu cầu | File / bằng chứng |
|---|---|
| ReactJS | frontend/src/main.jsx, frontend/package.json |
| ExpressJS | backend/src/app.js, backend/src/server.js |
| MongoDB | backend/src/model.js, infra/mongo/init.js, service mongodb |
| Dockerfile | backend/Dockerfile, frontend/Dockerfile |
| Docker Compose | docker-compose.yml, docker-compose.dev.yml |
| GitHub Actions | .github/workflows/ci.yml, deploy-local.yml, deploy-vps.yml |
| Jenkins | Jenkinsfile, ci/jenkins/Dockerfile, ci/jenkins/compose.yml |
| Hardware monitoring | Node Exporter, dashboard CPU/RAM/disk/network |
| Database monitoring | MongoDB Exporter, mongodb_up/connections/operations |
| Terraform VPS | infra/terraform/*.tf |
| Ansible install/deploy | infra/ansible/deploy.yml |
| .env và Axios từng môi trường | README mục 4, docs/VPS.md |
| Test thực tế | docs/VERIFICATION.md, backend/test, scripts/verify.ps1 |

## Ảnh chụp nên dùng trong báo cáo sau khi chạy Docker

- App có ảnh mẫu và bản ghi tự tạo.
- Docker Desktop hoặc `docker compose ps` với health status.
- Grafana dashboard đủ dữ liệu, không dùng ảnh dashboard trống làm bằng chứng.
- Prometheus targets UP và query `mongodb_up`.
- Workflow CI/Deploy hoặc Jenkins stage view thành công.
- `terraform validate`, Ansible syntax-check (khác với apply/deploy cloud).

## Giới hạn cần nói đúng khi bảo vệ

- Node Exporter trên Windows/Docker Desktop đo Linux VM.
- Panel network mặc định đo traffic container exporter do dùng bridge network.
- Chưa dùng cloud thật nên chưa chứng minh EC2/Ansible deployment end-to-end.
- Demo lưu URL, không upload file; không có auth nhiều người dùng.
- Alerts hiển thị trên Prometheus; chưa gửi thông báo ra email/Slack.
