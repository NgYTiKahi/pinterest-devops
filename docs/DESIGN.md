# Thiết kế đã thống nhất

Ngày 17/09/2026. Ưu tiên chạy local, không thuê hay tạo VPS.

Source gốc là HTML/Axios, Express và DynamoDB. Bản này giữ ý tưởng bảng ảnh,
chuyển sang React/Vite, Express và MongoDB. Không sao chép credentials AWS.

## Luồng ứng dụng

Browser → React → Axios `/api` → Vite proxy (dev) hoặc Nginx (Docker) →
Express:8088 → MongoDB:27017. CRUD ảnh theo URL, tìm kiếm và dữ liệu mẫu offline.
Ảnh mẫu SVG đi kèm frontend; không cần tài khoản S3 hay dịch vụ bên ngoài.

## Triển khai

- Localhost: MongoDB trong Docker; Node/Vite chạy trực tiếp để debug.
- Docker Desktop: toàn bộ frontend, backend, database và monitoring trong Compose.
- Các cổng chỉ bind 127.0.0.1 mặc định. Dữ liệu nằm trong named volumes.
- Terraform AWS EC2 và Ansible là tài liệu/mã tùy chọn, không được tự động apply.
- CI GitHub kiểm tra và build. CD local chạy thủ công trên self-hosted runner;
  Jenkins chạy container với Docker daemon dùng chung của máy local.
- CD VPS tùy chọn dùng SSH, image tag theo commit, healthcheck và rollback image.

## Giám sát

Prometheus scrape Node Exporter, MongoDB Exporter, Express và chính Prometheus.
Grafana có datasource/dashboard provisioning. Node Exporter trên Docker Desktop
đo Linux VM của Docker, không phải toàn bộ Windows host.

## Phạm vi

Ứng dụng demo một người dùng tại local, không xây hệ thống đăng nhập hay upload
file. CRUD URL ảnh tương đương và mở rộng chức năng source mẫu. Nếu đưa lên internet
cần bổ sung xác thực, TLS và chính sách truy cập. MongoDB có user ứng dụng riêng và
user giám sát chỉ đọc, không dùng tài khoản root cho backend.

## Kiểm chứng

Test API validation và CRUD qua MongoDB thật khi Docker sẵn sàng; build frontend;
Compose config; Prometheus rules; Terraform validate không tạo cloud; Ansible
syntax-check. Kiểm thử smoke xuyên Nginx/API/MongoDB và kiểm tra các target metrics.
