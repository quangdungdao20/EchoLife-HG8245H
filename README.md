# 🌐 EchoLife-HG8245H Manager

Giao diện Web & Flask Backend quản lý thiết bị và lọc MAC Router Huawei HG8245H.

---

## 🚀 Hướng Dẫn Chạy Nhanh

### 1. Khởi chạy Backend (Python)
```bash
cd backend

# Cài đặt thư viện & chạy
pip install flask flask-cors requests
python app.py
```
*Backend Flask chạy tại `http://localhost:5000`.*

> 💡 **Mẹo**: Chạy `python test_mock_router.py` (cổng 8080) để giả lập Router nếu test offline.

---

### 2. Mở cổng kết nối (Cloudflare Tunnel)
```bash
cloudflared tunnel --protocol http2 --url http://localhost:5000
```
*Copy đường dẫn `https://xxx.trycloudflare.com` được cấp ở màn hình terminal.*

---

### 3. Chạy Frontend
- Mở trực tiếp file `index.html` ở thư mục gốc hoặc deploy lên Vercel/Netlify.
- Vào tab **Settings** -> Dán đường dẫn Cloudflare Tunnel vừa copy -> **Lưu Cài Đặt**.

---

## 🔄 Di Chuyển Sang Máy Tính Khác

Khi cần chuyển hệ thống sang chạy trên một máy tính mới:

### 1. Tải code & Chạy Backend
```bash
git clone https://github.com/quangdungdao20/EchoLife-HG8245H.git
cd EchoLife-HG8245H/backend
python -m venv venv
.\venv\Scripts\activate # Windows
pip install flask flask-cors requests
python app.py
```

### 2. Chạy Cloudflare Tunnel trên máy mới
*   **Nếu dùng Quick Tunnel (Link ngẫu nhiên):**
    Chạy lệnh sau trên máy mới để nhận link HTTPS mới:
    ```bash
    cloudflared tunnel --protocol http2 --url http://localhost:5000
    ```
*   **Nếu dùng Named Tunnel (Link cố định):**
    Copy thư mục chứa file cấu hình của Cloudflare (thường nằm ở `C:\Users\<Tên_User>\.cloudflared`) từ máy cũ sang máy mới, sau đó chạy:
    ```bash
    cloudflared tunnel run <tên-tunnel>
    ```
