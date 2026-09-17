# Pinterest local implementation plan

**Goal:** Bàn giao dự án React–Express–MongoDB chạy local với bộ DevOps đầy đủ.
**Architecture:** React gọi `/api` qua proxy. Backend kết nối MongoDB bằng env.
Compose quản lý app và monitoring; CI/CD local độc lập với bộ VPS tùy chọn.
**Tech stack:** Node 24, React, Vite, Express, MongoDB 8, Docker Compose,
Prometheus, Grafana, Terraform AWS, Ansible, GitHub Actions, Jenkins.
**Spec:** DESIGN.md. Không tạo tài nguyên AWS. Source gốc được giữ nguyên.

## 1. API và frontend
- [x] Viết test validation trước, chạy `node --test backend/test/validation.test.js`.
- [x] Tạo `backend/src/validation.js`, `app.js`, `server.js`, `seed.js`;
      các route `/api/images`, `/api/health/live`, `/api/health/ready`, `/metrics`.
- [x] Test payload thiếu title, URL không hợp lệ, giới hạn độ dài, regex literal.
- [x] React có CRUD, search, loading/error/empty states, confirm xóa; Axios `/api`.
- [x] Cài dependencies, test API, `npm run build` frontend.

## 2. Docker và monitoring
- [x] Dockerfiles, Compose, Mongo init users, env generator và dev override.
- [x] Prometheus targets/rules, Grafana datasource và dashboard provisioned.
- [ ] Compose config; build; startup health; CRUD smoke qua Nginx; metrics targets.

## 3. CI/CD và IaC
- [x] GitHub CI kiểm tra/test/build; deploy local thủ công hoặc opt-in sau CI pass.
- [x] Jenkins container/pipeline validate, test, build, deploy local cùng project.
- [x] Terraform EC2/VPC/security group; Ansible cài Docker và deploy bản source.
- [x] Deploy VPS tùy chọn qua SSH với image tags bất biến, kiểm tra và rollback.
- [ ] Kiểm tra YAML, shell, Terraform và Ansible bằng tool có sẵn/container.

## 4. Bàn giao
- [x] README tiếng Việt, hướng dẫn demo, ma trận yêu cầu và báo cáo kiểm thử.
- [x] Đóng ZIP source không kèm node_modules, secret hay dữ liệu DB.

## Trạng thái bàn giao

Đã triển khai các phần source/config/documentation. Kết quả test ứng dụng, UI,
Compose/config và các mục bị giới hạn bởi quyền runtime được ghi riêng trong
VERIFICATION.md. Những bước kiểm chứng Docker/IaC không chạy được trong phiên này
không được coi là đã đạt chỉ vì source đã hoàn thành.
