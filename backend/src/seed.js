import mongoose from "mongoose";
import { Image } from "./model.js";
if (!process.env.MONGODB_URI) throw new Error("Thiếu MONGODB_URI");
const samples = [
  [
    "mountains",
    "Một ngày trên núi",
    "Chậm lại một chút, ngắm những tầng núi xa.",
  ],
  ["forest", "Lối nhỏ vào rừng", "Lưu lại sắc xanh cho một ngày cần bình yên."],
  ["sunset", "Nắng cuối ngày", "Một chút cam, một chút hồng và cả bầu trời."],
  [
    "architecture",
    "Những đường cong",
    "Cảm hứng kiến trúc từ những hình khối giản dị.",
  ],
  ["ocean", "Phía biển xanh", "Một chuyến đi bắt đầu từ một ý tưởng."],
  ["vase", "Góc nhà dịu dàng", "Vẻ đẹp của những vật dụng thường ngày."],
  ["desert", "Qua miền cát", "Ánh sáng, đường nét và những khoảng lặng."],
  [
    "garden",
    "Khu vườn nhỏ",
    "Nuôi dưỡng một góc xanh trong không gian của bạn.",
  ],
];
try {
  await mongoose.connect(process.env.MONGODB_URI);
  for (const [key, title, description] of samples)
    await Image.updateOne(
      { seedKey: key },
      {
        $setOnInsert: {
          seedKey: key,
          title,
          description,
          url: `/demo/${key}.svg`,
        },
      },
      { upsert: true },
    );
  console.log("Đã bảo đảm 8 ảnh mẫu tồn tại; giữ nguyên dữ liệu người dùng.");
} finally {
  await mongoose.disconnect();
}
