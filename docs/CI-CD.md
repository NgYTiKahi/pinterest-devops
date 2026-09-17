# CI/CD không cần thuê máy chủ

## GitHub Actions

Đưa **nội dung thư mục pinterest-local** vào root repository của bạn; không để
`.github` nằm lồng dưới một thư mục khác trong repository.

### CI tự động

`.github/workflows/ci.yml` chạy khi push `main`, pull request hoặc bấm Run workflow:

1. MongoDB 8 tạm trên GitHub runner.
2. `npm ci`, unit test và integration test API.
3. Build frontend và build/start toàn bộ Compose.
4. Smoke CRUD qua Nginx, kiểm tra Prometheus config.
5. Dọn container/volume CI kể cả khi lỗi.
6. Job infrastructure kiểm tra Terraform fmt/init/validate và Ansible syntax-check,
   không chạy Terraform plan/apply hay Ansible deployment.

Không cần AWS credentials. GitHub-hosted CI tuân theo quota/phí Actions của tài
khoản GitHub; không phải thuê VPS. Nếu chỉ demo offline, dùng Jenkins local.

### CD về máy Windows của bạn

1. Repo → Settings → Actions → Runners → New self-hosted runner → Windows x64.
2. Làm theo lệnh GitHub cấp, dùng user có quyền Docker Desktop. Giữ Docker Desktop
   và runner đang chạy trong cùng phiên đăng nhập; chạy interactively là dễ nhất.
3. Thêm label `pins-local` cho runner. Chỉ dùng repo/code mà bạn tin cậy.
4. Actions → **Deploy local Windows** → Run workflow.
5. Mặc định bản deploy nằm ở `%USERPROFILE%/Documents/PinsDeploy`.
   Có thể đặt repo variable `PINS_DEPLOY_DIR` thành đường dẫn mong muốn.
6. Muốn auto deploy sau khi CI của push main thành công: đặt variable
   `ENABLE_LOCAL_AUTO_DEPLOY=true`. Workflow checkout đúng SHA đã qua CI.

Script sao chép source sang thư mục deploy cố định, giữ `.env`, dùng container
Node tạo cấu hình lần đầu, `docker compose up --build --wait`, rồi verify.
Workflow không chạy code pull request trên self-hosted runner. Các pipeline local
cần bảo vệ nhánh main vì có quyền điều khiển Docker trên máy bạn.

Project Compose mặc định vẫn là `pins-local`, vì vậy runner sẽ cập nhật cùng stack
demo bạn đã chạy thủ công. Không chạy hai bản checkout/deploy đồng thời. Nếu chuyển
từ bản thủ công sang thư mục deploy mới, copy `.env` hiện tại vào thư mục deploy
trước để giữ credentials khớp volume MongoDB. CD không tự seed để tránh tái tạo ảnh
mẫu mà người dùng đã xóa.

### Publish image tùy chọn

Đặt variable `ENABLE_PUBLISH=true`. Sau khi CI pass trên main, job publish push:

```text
ghcr.io/<owner>/<repository>/backend:<40-char-commit-sha>
ghcr.io/<owner>/<repository>/frontend:<40-char-commit-sha>
```

Registry dùng `GITHUB_TOKEN` với quyền packages:write. Không dùng tag latest.
Phần publish không cần cho local và mặc định tắt.

## Jenkins bằng Docker

Từ root dự án:

```powershell
docker compose -f ci/jenkins/compose.yml up -d --build --wait --wait-timeout 300
docker compose -f ci/jenkins/compose.yml exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Mở http://localhost:8082, nhập initial password, tạo tài khoản admin. Các plugin
pipeline/git đã được cài trong Dockerfile. Tạo **Pipeline → Pipeline script from SCM
→ Git → repository URL**, nhánh `*/main`, Script Path `Jenkinsfile`. Repo private
cần Git credentials trong Jenkins. Build Now lần đầu; các lần sau `pollSCM`
kiểm tra thay đổi định kỳ 5 phút.

Pipeline: checkout → env → unit test/frontend build/Docker build → local deployment
→ seed idempotent → smoke và Prometheus config. Test integration MongoDB riêng đầy
đủ chạy ở GitHub CI; Jenkins kiểm tra database thật qua smoke của stack đã deploy.

| Thành phần Jenkins demo | Địa chỉ |
|---|---|
| Jenkins controller | http://localhost:8082 |
| App do Jenkins deploy | http://localhost:8081 |
| Grafana Jenkins | http://localhost:3001 |
| Prometheus Jenkins | http://localhost:9091 |

Jenkins dùng Docker-in-Docker có TLS và volume workspace dùng chung, tránh lỗi
bind mount đường dẫn container không tồn tại trên daemon. DinD cần privileged
container; chỉ bật cho lab local tin cậy. Không public Jenkins/Docker API ra mạng.
Không mount Docker socket thật của máy vào Jenkins. Stack app này độc lập với
stack `pins-local`; MongoDB và mật khẩu cũng độc lập.

Mật khẩu Grafana Jenkins nằm trong `/var/jenkins_home/pins-app.env` (giá trị
`GRAFANA_ADMIN_PASSWORD`). File được giữ qua các build. Không đổi tên job hoặc xóa
workspace khi stack đang chạy: Compose mount các file config trong workspace.

Dừng Jenkins (giữ volume):

```powershell
docker compose -f ci/jenkins/compose.yml stop
```

## VPS workflow — chỉ khi chủ động dùng sau này

Xem VPS.md, bootstrap Ansible trước. Workflow `deploy-vps.yml` chỉ chạy thủ công,
yêu cầu commit SHA đã publish; không tạo EC2. GitHub Environment `vps` nên bật
required reviewers. Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`.
Known hosts phải lấy từ host đã kiểm tra fingerprint; workflow không tắt host key
checking. VPS cần `sudo` chạy script deploy và quyền pull GHCR (nếu image private,
đăng nhập GHCR cho root trước bằng token read:packages).

Security group mẫu chỉ cho IP quản trị /32, nên GitHub-hosted runner sẽ **không tự
truy cập SSH được**. Khi thật sự dùng workflow này, đặt runner trên mạng/IP tin cậy
và đổi `runs-on`, hoặc tự cấu hình đường truyền quản trị phù hợp. Không mở SSH
`0.0.0.0/0` chỉ để demo. Với nhu cầu hiện tại, không cần cấu hình phần này.

Rollback image: script tự khôi phục `.env.previous` nếu deployment mới lỗi và thử
start bản trước. Rollback chỉ đổi image/config, không phục hồi DB; giữ image cũ
trên máy. Local demo rebuild không có rollback tự động; có thể checkout commit
trước rồi rebuild. Không xóa volume để rollback ứng dụng.
