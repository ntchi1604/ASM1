import type { ProductDetail } from "@/lib/types";

/**
 * Nội dung chuyên môn cho trang chi tiết.
 *
 * Cố ý KHÔNG có đủ 24 sản phẩm. Trang chi tiết vẫn chạy khi thiếu: nó bỏ
 * khối tóm tắt AI và ghi rõ "đang cập nhật" thay vì bịa liều dùng. Một khối
 * tóm tắt sai liều thì tệ hơn hẳn một khối vắng mặt.
 *
 * Liều lấy theo tờ hướng dẫn sử dụng lưu hành tại Việt Nam. Mọi mục đều viết
 * cho người không học dược đọc.
 */
export const productDetails: ProductDetail[] = [
  {
    productId: "hapacol-650",
    registrationNumber: "VD-24567-16",
    manufacturer: "Công ty Cổ phần Dược Hậu Giang (DHG Pharma)",
    shelfLife: "36 tháng kể từ ngày sản xuất",
    therapeuticGroup: "Thuốc hạ sốt, giảm đau",
    uses: [
      "Hạ sốt cho người lớn và trẻ trên 12 tuổi",
      "Giảm đau đầu, đau răng, đau cơ mức nhẹ đến trung bình",
      "Giảm đau sau tiêm chủng",
    ],
    dosage: [
      "Người lớn: 1 viên mỗi lần, cách nhau tối thiểu 4 giờ",
      "Không quá 6 viên trong 24 giờ",
      "Hoà tan hoàn toàn 1 viên trong 200 ml nước, uống ngay sau khi tan",
    ],
    cautions: [
      "Không dùng cùng thuốc khác có chứa Paracetamol — đây là nguyên nhân quá liều thường gặp nhất",
      "Không uống rượu trong thời gian dùng thuốc",
      "Người bệnh gan, bệnh thận cần hỏi dược sĩ trước khi dùng",
      "Viên sủi chứa natri: người đang ăn nhạt theo chỉ định cần hỏi dược sĩ",
    ],
    sideEffects:
      "Ít gặp: buồn nôn, phát ban. Ngừng thuốc và đến cơ sở y tế ngay nếu nổi mẩn, khó thở hoặc vàng da.",
    storage: "Dưới 30°C, nơi khô ráo, tránh ánh sáng trực tiếp",
    manufacturerSourceLabel: "Tờ hướng dẫn sử dụng Hapacol 650 — DHG Pharma",
    quickQuestions: [
      "Uống trước hay sau ăn?",
      "Trẻ 6 tuổi dùng được không?",
      "Có buồn ngủ không?",
    ],
  },
  {
    productId: "panadol-extra",
    registrationNumber: "VN-18321-14",
    manufacturer: "Sanofi-Aventis Việt Nam",
    shelfLife: "36 tháng kể từ ngày sản xuất",
    therapeuticGroup: "Thuốc hạ sốt, giảm đau",
    uses: [
      "Giảm đau đầu, đau nửa đầu, đau răng, đau bụng kinh",
      "Hạ sốt trong cảm lạnh và cảm cúm",
      "Giảm đau cơ, đau lưng mức nhẹ đến trung bình",
    ],
    dosage: [
      "Người lớn và trẻ trên 12 tuổi: 1–2 viên mỗi lần, cách nhau 4–6 giờ",
      "Không quá 8 viên trong 24 giờ",
      "Uống với nhiều nước, không nghiền hay nhai viên",
    ],
    cautions: [
      "Chứa caffein: hạn chế trà, cà phê khi đang dùng để tránh mất ngủ, tim đập nhanh",
      "Không dùng cùng thuốc khác có chứa Paracetamol",
      "Không dùng quá 3 ngày liên tục để hạ sốt nếu chưa hỏi ý kiến dược sĩ",
    ],
    sideEffects:
      "Có thể gặp khó ngủ, bồn chồn do caffein. Ngừng thuốc nếu nổi mẩn hoặc phù mặt.",
    storage: "Dưới 30°C, tránh ẩm",
    manufacturerSourceLabel: "Tờ hướng dẫn sử dụng Panadol Extra — Sanofi",
    quickQuestions: [
      "Vì sao Panadol Extra gây mất ngủ?",
      "Uống mấy viên một lần là đủ?",
      "Đang cho con bú dùng được không?",
    ],
  },
  {
    productId: "efferalgan-500",
    registrationNumber: "VN-20145-17",
    manufacturer: "UPSA SAS, Pháp",
    shelfLife: "36 tháng kể từ ngày sản xuất",
    therapeuticGroup: "Thuốc hạ sốt, giảm đau",
    uses: [
      "Hạ sốt cho người lớn và trẻ trên 12 tuổi",
      "Giảm đau đầu, đau răng, đau họng mức nhẹ đến trung bình",
    ],
    dosage: [
      "Người lớn: 1 viên mỗi lần, cách nhau tối thiểu 4 giờ",
      "Không quá 6 viên trong 24 giờ",
      "Hoà tan trong nửa cốc nước, chờ tan hết bọt rồi uống",
    ],
    cautions: [
      "Không dùng cùng thuốc khác có chứa Paracetamol",
      "Viên sủi chứa natri: người tăng huyết áp đang ăn nhạt cần hỏi dược sĩ",
      "Người bệnh gan cần giảm liều theo chỉ định của bác sĩ",
    ],
    sideEffects: "Ít gặp: buồn nôn, dị ứng da. Ngừng thuốc nếu nổi mẩn.",
    storage: "Dưới 30°C, giữ nguyên trong tuýp, đóng nắp kín sau khi lấy viên",
    manufacturerSourceLabel: "Tờ hướng dẫn sử dụng Efferalgan 500 — UPSA",
    quickQuestions: [
      "Khác gì Hapacol 650?",
      "Người tăng huyết áp uống được không?",
      "Bao lâu thì hạ sốt?",
    ],
  },
  {
    productId: "hapacol-150",
    registrationNumber: "VD-22890-15",
    manufacturer: "Công ty Cổ phần Dược Hậu Giang (DHG Pharma)",
    shelfLife: "36 tháng kể từ ngày sản xuất",
    therapeuticGroup: "Thuốc hạ sốt, giảm đau cho trẻ em",
    uses: [
      "Hạ sốt cho trẻ cân nặng 10–15 kg, tương ứng khoảng 1–3 tuổi",
      "Giảm đau khi trẻ mọc răng, sau tiêm chủng",
    ],
    dosage: [
      "Liều tính theo cân nặng: 10–15 mg Paracetamol cho mỗi kg, mỗi lần",
      "Trẻ 10–15 kg: 1 gói mỗi lần, cách nhau 4–6 giờ",
      "Không quá 4 gói trong 24 giờ",
      "Hoà gói bột vào 5–10 ml nước, cho trẻ uống ngay",
    ],
    cautions: [
      "Cân trẻ trước khi tính liều — dùng theo tuổi dễ sai liều hơn theo cân nặng",
      "Không dùng cùng siro cảm khác có chứa Paracetamol",
      "Trẻ sốt trên 2 ngày không giảm, hoặc dưới 3 tháng tuổi bị sốt: đưa đến cơ sở y tế",
    ],
    sideEffects:
      "Hiếm gặp: phát ban, buồn nôn. Ngừng thuốc và đưa trẻ đi khám nếu nổi mẩn hoặc li bì.",
    storage: "Dưới 30°C, nơi khô ráo",
    manufacturerSourceLabel: "Tờ hướng dẫn sử dụng Hapacol 150 — DHG Pharma",
    quickQuestions: [
      "Con tôi 13 kg thì uống mấy gói?",
      "Cách nhau bao lâu thì cho uống tiếp?",
      "Sốt bao nhiêu độ mới cần hạ sốt?",
    ],
  },
  {
    productId: "tamiflu-75",
    registrationNumber: "VN-19876-16",
    manufacturer: "F. Hoffmann-La Roche Ltd., Thuỵ Sĩ",
    shelfLife: "84 tháng kể từ ngày sản xuất",
    therapeuticGroup: "Thuốc kháng virus cúm",
    uses: [
      "Điều trị cúm A và cúm B đã được chẩn đoán",
      "Dự phòng cúm sau khi tiếp xúc nguồn lây, theo chỉ định của bác sĩ",
    ],
    dosage: [
      "Chỉ dùng theo đơn của bác sĩ — liều phụ thuộc cân nặng và chức năng thận",
      "Người lớn thường dùng 1 viên 75mg, 2 lần mỗi ngày, trong 5 ngày",
      "Hiệu quả cao nhất khi bắt đầu trong 48 giờ đầu có triệu chứng",
      "Uống đủ 5 ngày kể cả khi đã đỡ, để tránh virus kháng thuốc",
    ],
    cautions: [
      "Thuốc kê đơn: MediVia chỉ bán khi có đơn hợp lệ và dược sĩ đã kiểm tra",
      "Không phải thuốc hạ sốt — cúm vẫn cần hạ sốt và bù nước riêng",
      "Người suy thận cần bác sĩ tính lại liều",
      "Theo dõi trẻ và thanh thiếu niên về biểu hiện lú lẫn, hành vi bất thường",
    ],
    sideEffects:
      "Thường gặp: buồn nôn, nôn, đau đầu. Báo bác sĩ nếu nôn nhiều không uống được thuốc.",
    storage: "Dưới 25°C, nơi khô ráo",
    manufacturerSourceLabel: "Tờ hướng dẫn sử dụng Tamiflu 75mg — Roche",
    quickQuestions: [
      "Cúm thường có cần Tamiflu không?",
      "Vì sao phải uống đủ 5 ngày?",
      "Cần giấy tờ gì để mua thuốc kê đơn?",
    ],
  },
  {
    productId: "augmentin-625",
    registrationNumber: "VN-17654-13",
    manufacturer: "GlaxoSmithKline, Anh",
    shelfLife: "24 tháng kể từ ngày sản xuất",
    therapeuticGroup: "Kháng sinh nhóm beta-lactam",
    uses: [
      "Nhiễm khuẩn đường hô hấp: viêm xoang, viêm phế quản, viêm phổi",
      "Nhiễm khuẩn tiết niệu, da và mô mềm do vi khuẩn nhạy cảm",
    ],
    dosage: [
      "Chỉ dùng theo đơn của bác sĩ",
      "Người lớn thường dùng 1 viên mỗi 12 giờ, uống ngay đầu bữa ăn",
      "Uống đủ số ngày bác sĩ ghi trong đơn, thường 5–7 ngày",
    ],
    cautions: [
      "Thuốc kê đơn: phải có đơn hợp lệ, dược sĩ kiểm tra trước khi bán",
      "Kháng sinh không có tác dụng với cảm cúm do virus",
      "Ngừng thuốc giữa liệu trình làm vi khuẩn kháng thuốc — đây là lý do dùng đủ ngày",
      "Báo bác sĩ nếu từng dị ứng penicillin",
    ],
    sideEffects:
      "Thường gặp: tiêu chảy, buồn nôn. Ngừng thuốc và đi khám ngay nếu nổi mề đay, khó thở, phù mặt.",
    storage: "Dưới 25°C, nơi khô ráo",
    manufacturerSourceLabel: "Tờ hướng dẫn sử dụng Augmentin 625mg — GSK",
    quickQuestions: [
      "Cảm cúm có cần uống kháng sinh không?",
      "Quên một liều thì làm sao?",
      "Uống kháng sinh có cần men vi sinh?",
    ],
  },
];

export function getProductDetail(productId: string): ProductDetail | undefined {
  return productDetails.find((detail) => detail.productId === productId);
}
