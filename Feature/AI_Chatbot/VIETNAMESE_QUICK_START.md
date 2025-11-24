# 🇻🇳 Hướng Dẫn Nhanh - Chatbot Tài Chính Tiếng Việt

## 🚀 Cài Đặt

```bash
# 1. Kích hoạt môi trường
conda activate py310

# 2. Cài đặt dependencies
pip install -r requirement.txt

# 3. Cấu hình API key
cp .env_example .env
# Thêm GEMINI_API_KEY vào file .env

# 4. Làm sạch dữ liệu
python data_cleaner.py

# 5. Tạo stores trên Gemini
python gemini_file_search.py setup

# 6. Test tiếng Việt
python test/chatbot_demo_vietnamese.py --quick
```

## 💬 Sử Dụng

### Interactive Mode
```bash
python chatbot.py --user-id 44dfe804-3a46-4206-91a9-2685f7d5e003

# Nhập câu hỏi tiếng Việt:
> Tôi đã chi bao nhiêu cho Ăn uống?
> Ngân sách còn lại bao nhiêu?
> Tiến độ mục tiêu như thế nào?
```

### Single Query
```bash
python chatbot.py \
  --user-id 44dfe804-3a46-4206-91a9-2685f7d5e003 \
  --query "Tôi đã chi bao nhiêu cho Ăn uống tháng này?"
```

## 📝 Ví Dụ Câu Hỏi

**Giao Dịch**
- Tôi đã chi bao nhiêu cho Ăn uống?
- Cho tôi xem giao dịch gần đây
- Chi tiêu lớn nhất là gì?

**Ngân Sách**
- Ngân sách của tôi còn bao nhiêu?
- Tôi đã dùng bao nhiêu phần trăm ngân sách?
- Tôi có chi quá không?

**Mục Tiêu**
- Tiến độ quỹ dự phòng như thế nào?
- Tôi cần tiết kiệm bao nhiêu mỗi tháng?
- Khi nào tôi đạt mục tiêu?

**Phân Tích**
- Phân tích chi tiêu tháng này
- So sánh thu chi với tháng trước
- Xu hướng chi tiêu như thế nào?

## ✅ Test Kết Quả

3/3 câu hỏi tiếng Việt trả lời chính xác:
- ✅ Chi tiêu Ăn uống: $70.50
- ✅ Tiết kiệm cần thiết: $576.92/tháng  
- ✅ Thu chi: $3,000 / $70.50

## 📚 Tài Liệu

- [README.md](README.md) - Hướng dẫn đầy đủ
- [VIETNAMESE_SUPPORT.md](VIETNAMESE_SUPPORT.md) - Chi tiết tiếng Việt
- [AGENTS_CHATBOT.md](AGENTS_CHATBOT.md) - Thông tin agents
