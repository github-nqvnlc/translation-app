# Troubleshooting Guide

## Invalid Source Map Warnings

### Vấn đề
Khi chạy `npm run dev`, bạn có thể thấy nhiều warnings như:
```
Invalid source map. Only conformant source maps can be used to find the original code.
```

### Giải thích
- Đây là **warnings bình thường** từ Next.js development mode
- Không ảnh hưởng đến chức năng của ứng dụng
- Xuất hiện từ source maps trong `node_modules/next`
- Không phải lỗi từ code của bạn

### Giải pháp

#### Option 1: Bỏ qua (Khuyến nghị)
- Các warnings này **không ảnh hưởng** đến chức năng
- Ứng dụng vẫn chạy bình thường
- Có thể bỏ qua an toàn

#### Option 2: Cấu hình cho Next.js 16 (Turbopack)
Next.js 16 sử dụng Turbopack mặc định. Thêm vào `next.config.ts`:
```typescript
const nextConfig = {
  // ... existing config
  productionBrowserSourceMaps: false,
  turbopack: {
    // Turbopack sẽ tự xử lý source maps
  },
};
```

**Lưu ý**: Không dùng `webpack` config trong Next.js 16 với Turbopack. Nếu cần dùng webpack, chạy với flag `--webpack`:
```bash
npm run dev -- --webpack
```

#### Option 3: Filter Warnings trong Terminal
Chạy dev server với filter:
```bash
npm run dev 2>&1 | grep -v "Invalid source map"
```

#### Option 4: Cập nhật Next.js
Các warnings này thường được fix trong các phiên bản mới hơn:
```bash
npm install next@latest
```

### Lưu ý
- ⚠️ **Không nên** tắt source maps nếu bạn cần debug
- ⚠️ Warnings này **không ảnh hưởng** đến production build
- ✅ Ứng dụng vẫn hoạt động bình thường với các warnings này

