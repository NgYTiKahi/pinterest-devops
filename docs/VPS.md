# Terraform và Ansible — phần chuẩn bị, không cần chạy cho local

**Không có tài nguyên AWS nào được tạo trong quá trình chuẩn bị dự án này.**
Không cần tài khoản cloud để chạy React/Express/MongoDB, monitoring hoặc Jenkins.

## Terraform

Module tạo VPC, public subnet, internet gateway, route table, security group,
SSH public key và EC2 Ubuntu 24.04 amd64; EBS 30 GB được mã hóa, IMDSv2 bắt buộc.
SSH và HTTP giới hạn theo `admin_cidr` /32. MongoDB/monitoring không public.
Đây là cấu hình lab một máy, chưa phải hạ tầng HA/production.

Kiểm tra định dạng/cấu trúc bằng container, không tạo cloud:

```powershell
docker run --rm --mount "type=bind,source=$PWD/infra/terraform,target=/infra" -w /infra hashicorp/terraform:1.13.3 fmt -check
docker run --rm --mount "type=bind,source=$PWD/infra/terraform,target=/infra" -w /infra hashicorp/terraform:1.13.3 init -backend=false
docker run --rm --mount "type=bind,source=$PWD/infra/terraform,target=/infra" -w /infra hashicorp/terraform:1.13.3 validate
```

`init` tải provider nên cần Internet; `validate` không tạo EC2 và không cần AWS
credentials. State mặc định local để thuận tiện học; nếu làm nhóm, cấu hình remote
state có locking và quyền phù hợp. Không commit state hoặc tfvars chứa thông tin thật.

Chỉ khi bạn chủ động quyết định thuê VPS sau này, dùng Terraform CLI trong môi
trường đã đăng nhập AWS, tạo `terraform.tfvars` từ `.example`, thay IP và SSH key:

```bash
cd infra/terraform
terraform init
terraform plan -out=tfplan
# Kiểm tra chi phí và nội dung plan trước khi chạy lệnh tạo tài nguyên:
terraform apply tfplan
terraform output -raw ansible_inventory > ../ansible/inventory.ini
```

Terraform `apply` có thể phát sinh phí EC2/EBS/public IPv4. Không chạy cho bài demo
local. Sau khi hoàn tất cloud lab, xem lại `terraform plan -destroy` trước khi
chủ động `terraform destroy`; thao tác này xóa cả EC2 và EBS chứa dữ liệu.

## Ansible

Playbook dùng built-in modules, cài Docker CE/Compose từ Docker apt repository,
đóng gói source không kèm secrets/dependencies, giải nén vào `/opt/pins/app`, tạo
`.env` lần đầu bằng Node container, build/deploy Compose và check readiness.
Chạy lại giữ credentials và MongoDB volume.

Kiểm tra syntax bằng Docker:

```powershell
docker build -t pins-ansible infra/ansible
docker run --rm --mount "type=bind,source=$PWD,target=/workspace,readonly" pins-ansible -i inventory.ini.example deploy.yml --syntax-check
```

Khi có VPS thật, chạy từ Linux/WSL có Ansible hoặc dùng image ở trên. Với Ansible
cài trong WSL:

```bash
cd infra/ansible
# Nếu không dùng output Terraform, copy inventory.ini.example rồi sửa IP và SSH key.
ssh ubuntu@YOUR_VPS_IP   # kiểm tra host fingerprint trước
ansible-playbook -i inventory.ini deploy.yml
```

Script cần Ubuntu 24.04 x86_64 và user SSH có sudo. HTTP listen port 80; security
group giới hạn người truy cập. `.env` quyền 0600 trên VPS, không được in ra log.

Xem monitoring qua SSH tunnel:

```bash
ssh -L 3000:127.0.0.1:3000 -L 9090:127.0.0.1:9090 ubuntu@YOUR_VPS_IP
```

Mở localhost:3000/9090 trên máy quản trị. Nếu đưa ứng dụng ra Internet cho nhiều
người, cần bổ sung HTTPS, đăng nhập/phân quyền, backup và kiểm thử restore; bản
hiện tại chủ đích là local/lab giới hạn IP.

## Kết nối theo môi trường

| Nơi chạy backend | Host MongoDB | Axios trong browser | Proxy |
|---|---|---|---|
| Node trực tiếp | 127.0.0.1:27017 | /api | Vite → 127.0.0.1:8088 |
| Docker Desktop | mongodb:27017 | /api | Nginx → backend:8088 |
| VPS Compose | mongodb:27017 | /api | Nginx → backend:8088 |

Không có IP AWS hardcode trong frontend. Không dùng AWS keys từ source mẫu.
