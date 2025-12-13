# 📘 Hướng Dẫn Sử Dụng - Ứng Dụng Quản Lý Tài Chính Cá Nhân

## 🎯 Giới Thiệu

Ứng dụng **Quản Lý Tài Chính Cá Nhân** giúp bạn theo dõi thu chi, thiết lập ngân sách, đặt mục tiêu tài chính, và nhận gợi ý thông minh từ AI để quản lý tài chính hiệu quả hơn.

---

## 🚀 Bắt Đầu

### 1. Đăng Ký Tài Khoản

1. Truy cập trang web của ứng dụng
2. Nhấp vào nút **"Đăng ký"** hoặc **"Register"**
3. Điền thông tin:
   - **Email**: Địa chỉ email hợp lệ của bạn
   - **Mật khẩu**: Mật khẩu mạnh (ít nhất 8 ký tự)
   - **Xác nhận mật khẩu**: Nhập lại mật khẩu
4. Nhấp **"Đăng ký"** để hoàn tất

### 2. Đăng Nhập

1. Vào trang đăng nhập
2. Nhập **email** và **mật khẩu** đã đăng ký
3. Nhấp **"Đăng nhập"** để truy cập hệ thống

---

## 💰 Quản Lý Giao Dịch

### Thêm Giao Dịch Mới

Giao dịch là các khoản thu hoặc chi trong cuộc sống hàng ngày của bạn.

1. Vào menu **"Giao dịch"** (Transactions)
2. Nhấp nút **"Thêm giao dịch mới"**
3. Điền thông tin:
   - **Số tiền**: Nhập số tiền giao dịch (VD: 50000)
   - **Danh mục**: Chọn danh mục phù hợp (Ăn uống, Di chuyển, Giải trí, Lương...)
   - **Mô tả**: Ghi chú chi tiết về giao dịch (VD: "Mua cà phê Starbucks")
   - **Ngày thực hiện**: Chọn ngày giao dịch
   - **Loại tiền tệ**: Chọn đơn vị tiền (USD, VND...)
4. Nhấp **"Lưu"** để hoàn tất

### Xem Danh Sách Giao Dịch

- **Lọc theo danh mục**: Chọn danh mục để xem giao dịch thuộc danh mục đó
- **Lọc theo ngày**: Chọn khoảng thời gian để xem giao dịch trong thời gian đó
- **Tìm kiếm**: Gõ từ khóa trong ô tìm kiếm để tìm giao dịch theo mô tả

### Sửa/Xóa Giao Dịch

1. Tìm giao dịch cần sửa/xóa trong danh sách
2. Nhấp vào biểu tượng **"Sửa"** (Edit) để chỉnh sửa thông tin
3. Hoặc nhấp **"Xóa"** (Delete) để xóa giao dịch

### Upload Giao Dịch Từ File CSV

Bạn có thể nhập hàng loạt giao dịch từ file CSV:

1. Chuẩn bị file CSV với các cột:
   - `amount`: Số tiền (bắt buộc)
   - `date`: Ngày giao dịch (bắt buộc, định dạng: YYYY-MM-DD)
   - `description`: Mô tả giao dịch
   - `category`: Tên danh mục
   - `currency`: Loại tiền tệ (mặc định: USD)

   **Ví dụ file CSV:**
   ```csv
   amount,date,description,category,currency
   50000,2025-01-15,Mua cà phê,Ăn uống,VND
   200000,2025-01-14,Xăng xe,Di chuyển,VND
   ```

2. Vào trang **"Giao dịch"**
3. Nhấp **"Upload CSV"**
4. Chọn file CSV từ máy tính
5. Hệ thống sẽ tự động nhập và báo kết quả

---

## 📊 Ngân Sách (Budgets)

### Tạo Ngân Sách

Ngân sách giúp bạn kiểm soát chi tiêu trong từng danh mục hoặc tổng thể.

1. Vào menu **"Ngân sách"** (Budgets)
2. Nhấp **"Tạo ngân sách mới"**
3. Điền thông tin:
   - **Số tiền giới hạn**: Số tiền tối đa bạn muốn chi trong kỳ (VD: 5000000)
   - **Chu kỳ**: Chọn MONTHLY (Hàng tháng), WEEKLY (Hàng tuần), hoặc ANNUAL (Hàng năm)
   - **Danh mục** (tùy chọn): Chọn danh mục cụ thể hoặc để trống cho ngân sách tổng thể
4. Nhấp **"Lưu"**

### Theo Dõi Ngân Sách

- Hệ thống tự động tính toán **% đã chi tiêu** so với ngân sách
- Bạn sẽ nhận **cảnh báo** khi vượt ngân sách hoặc gần đạt giới hạn
- Xem biểu đồ trực quan để dễ dàng theo dõi

---

## 🎯 Mục Tiêu Tài Chính (Goals)

### Đặt Mục Tiêu

Mục tiêu giúp bạn tiết kiệm cho những kế hoạch lớn.

1. Vào menu **"Mục tiêu"** (Goals)
2. Nhấp **"Tạo mục tiêu mới"**
3. Điền thông tin:
   - **Tiêu đề**: Tên mục tiêu (VD: "Mua laptop mới")
   - **Số tiền mục tiêu**: Số tiền cần đạt được (VD: 20000000)
   - **Ngày hoàn thành** (tùy chọn): Chọn ngày mong muốn đạt mục tiêu
   - **Tiến độ hiện tại**: Số tiền đã tiết kiệm được (mặc định: 0)
4. Nhấp **"Lưu"**

### Cập Nhật Tiến Độ

1. Mở mục tiêu cần cập nhật
2. Nhấp **"Cập nhật tiến độ"**
3. Nhập số tiền mới đã tiết kiệm
4. Hệ thống sẽ tính **% hoàn thành** tự động

---

## 📈 Phân Tích Chi Tiêu

### Xem Báo Cáo Tổng Hợp

1. Vào trang **"Phân tích"** hoặc **"Analytics"**
2. Chọn khoảng thời gian cần xem (tuần, tháng, năm)
3. Chọn nhóm dữ liệu theo:
   - **Tháng** (month): Xem chi tiêu theo từng tháng
   - **Tuần** (week): Xem chi tiêu theo từng tuần
   - **Năm** (year): Xem chi tiêu theo từng năm

### Các Biểu Đồ Hỗ Trợ

- **Biểu đồ tròn**: Phân bổ chi tiêu theo danh mục
- **Biểu đồ cột**: So sánh chi tiêu qua các tháng
- **Xu hướng**: Xem xu hướng tăng/giảm chi tiêu

---

## 🤖 Gợi Ý Từ AI

Hệ thống AI sẽ phân tích dữ liệu chi tiêu của bạn và đưa ra:

- **Cảnh báo chi tiêu bất thường**: Khi chi tiêu tăng đột biến
- **Gợi ý tiết kiệm**: Dựa trên thói quen chi tiêu
- **Dự đoán ngân sách**: Giúp lập kế hoạch tốt hơn cho tháng tiếp theo

### Cách Xem Gợi Ý

1. Vào trang **Dashboard** hoặc **"AI Insights"**
2. Xem các gợi ý được hiển thị dưới dạng card
3. Đọc và áp dụng các lời khuyên phù hợp

---

## 🔐 Quản Lý Tài Khoản

### Đổi Thông Tin Cá Nhân

1. Vào **"Cài đặt"** (Settings)
2. Chỉnh sửa thông tin cần thiết
3. Nhấp **"Lưu thay đổi"**

### Đổi Mật Khẩu

1. Vào **"Cài đặt"** > **"Bảo mật"**
2. Nhập mật khẩu cũ
3. Nhập mật khẩu mới
4. Xác nhận mật khẩu mới
5. Nhấp **"Cập nhật"**

### Đăng Xuất

Nhấp vào avatar hoặc tên người dùng ở góc trên, chọn **"Đăng xuất"** (Logout).

---

## ❓ Câu Hỏi Thường Gặp (FAQ)

### 1. Tôi quên mật khẩu, phải làm sao?

Hiện tại, vui lòng liên hệ với quản trị viên để được hỗ trợ đặt lại mật khẩu. Tính năng tự động đặt lại mật khẩu sẽ được cập nhật trong phiên bản tiếp theo.

### 2. Tôi có thể sử dụng nhiều loại tiền tệ không?

Có! Mỗi giao dịch có thể chọn loại tiền tệ riêng (USD, VND, EUR...). Hệ thống sẽ lưu và hiển thị đúng loại tiền bạn đã chọn.

### 3. Dữ liệu của tôi có an toàn không?

Tất cả dữ liệu được mã hóa và lưu trữ an toàn. Chỉ bạn mới có thể truy cập dữ liệu tài chính của mình.

### 4. Tôi có thể xuất dữ liệu ra không?

Tính năng xuất dữ liệu (export to CSV/Excel) sẽ được cập nhật trong phiên bản sau.

### 5. Làm thế nào để xóa tài khoản?

Vui lòng liên hệ với bộ phận hỗ trợ để được hướng dẫn xóa tài khoản.

---

## 💡 Mẹo Sử Dụng Hiệu Quả

1. **Nhập giao dịch ngay khi phát sinh**: Đừng để tích lũy, bạn sẽ dễ quên mất chi tiết
2. **Sử dụng danh mục chi tiết**: Giúp phân tích chính xác hơn
3. **Đặt ngân sách thực tế**: Dựa trên thu nhập và nhu cầu thực tế
4. **Kiểm tra báo cáo hàng tuần**: Để điều chỉnh chi tiêu kịp thời
5. **Đặt mục tiêu ngắn hạn và dài hạn**: Tạo động lực tiết kiệm

---

## 📞 Hỗ Trợ

Nếu bạn gặp vấn đề hoặc cần trợ giúp:

- Xem tài liệu kỹ thuật: `API_DOCUMENTATION.md`
- Xem hướng dẫn cài đặt: `SETUP.md`
- Liên hệ với đội ngũ phát triển qua GitHub Issues

---

**Chúc bạn quản lý tài chính thành công! 🎉**
