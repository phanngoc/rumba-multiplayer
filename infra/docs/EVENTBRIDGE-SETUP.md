# EventBridge Auto Start/Stop EC2 Setup

Tài liệu này mô tả cách thiết lập EventBridge để tự động dừng EC2 instance lúc 21:00 và khởi động lại lúc 8:00 sáng.

## Kiến trúc

- **EventBridge Rules**: 2 rules theo lịch trình cron
  - `stop-rumba-instance`: Dừng instance lúc 21:00 UTC hàng ngày
  - `start-rumba-instance`: Khởi động instance lúc 8:00 UTC hàng ngày

- **Lambda Functions**: 2 functions để thực hiện start/stop
  - `stop-rumba-instance`: Dừng EC2 instance
  - `start-rumba-instance`: Khởi động EC2 instance

- **IAM Roles & Policies**: Quyền cần thiết cho Lambda functions

## Cấu hình

### Lịch trình Cron
- **Dừng instance**: `cron(0 21 * * ? *)` - 21:00 UTC hàng ngày
- **Khởi động instance**: `cron(0 8 * * ? *)` - 8:00 UTC hàng ngày

### Timezone
- Tất cả thời gian đều tính theo UTC
- Để chuyển đổi sang múi giờ Việt Nam (UTC+7):
  - 21:00 UTC = 4:00 sáng ngày hôm sau (VN)
  - 8:00 UTC = 15:00 chiều (VN)

## Triển khai

1. **Chuẩn bị**:
   ```bash
   cd infra
   ```

2. **Khởi tạo Terraform**:
   ```bash
   terraform init
   ```

3. **Xem kế hoạch triển khai**:
   ```bash
   terraform plan
   ```

4. **Triển khai**:
   ```bash
   terraform apply
   ```

## Kiểm tra

### Kiểm tra EventBridge Rules
```bash
aws events list-rules --name-prefix "rumba"
```

### Kiểm tra Lambda Functions
```bash
aws lambda list-functions --query 'Functions[?contains(FunctionName, `rumba`)]'
```

### Test thủ công
```bash
# Test dừng instance
aws lambda invoke --function-name stop-rumba-instance response.json

# Test khởi động instance
aws lambda invoke --function-name start-rumba-instance response.json
```

## Monitoring

### CloudWatch Logs
- Logs của Lambda functions được lưu trong CloudWatch Logs
- Log group: `/aws/lambda/stop-rumba-instance` và `/aws/lambda/start-rumba-instance`

### CloudWatch Metrics
- EventBridge metrics: `AWS/Events`
- Lambda metrics: `AWS/Lambda`

## Troubleshooting

### Lỗi thường gặp

1. **Lambda không có quyền**:
   - Kiểm tra IAM role và policy
   - Đảm bảo role có quyền `ec2:StartInstances` và `ec2:StopInstances`

2. **EventBridge không trigger Lambda**:
   - Kiểm tra Lambda permission
   - Kiểm tra EventBridge rule có enabled không

3. **Instance không start/stop**:
   - Kiểm tra instance ID trong environment variable
   - Kiểm tra instance state trước khi thực hiện action

### Debug Commands

```bash
# Xem logs Lambda
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/rumba"

# Xem chi tiết EventBridge rule
aws events describe-rule --name "stop-rumba-instance"

# Kiểm tra instance state
aws ec2 describe-instances --instance-ids <instance-id>
```

## Tùy chỉnh

### Thay đổi thời gian
Sửa `schedule_expression` trong `main.tf`:

```hcl
# Dừng lúc 22:00 UTC (5:00 sáng VN)
schedule_expression = "cron(0 22 * * ? *)"

# Khởi động lúc 7:00 UTC (14:00 VN)
schedule_expression = "cron(0 7 * * ? *)"
```

### Thêm nhiều instance
Sửa environment variable trong Lambda functions để nhận danh sách instance IDs.

## Chi phí

- **EventBridge**: Miễn phí cho 1 triệu events/tháng
- **Lambda**: Miễn phí cho 1 triệu requests/tháng và 400,000 GB-seconds
- **CloudWatch Logs**: Miễn phí cho 5GB/tháng

Tổng chi phí cho setup này gần như bằng 0.
