import { site } from "@/lib/data/site";

/**
 * Nội dung các trang tĩnh: giới thiệu, chính sách, hướng dẫn.
 *
 * Mười trang này đều là chữ và cùng một bố cục, nên để chung một sổ rồi cho
 * `app/(shop)/[page]` render — mười thư mục `page.tsx` gần giống nhau là mười chỗ
 * để lệch nhau về sau, mà cũng không có gì để mỗi trang tự quyết.
 *
 * Trang nào có phần tương tác riêng (tra cứu đơn, tài khoản, tải đơn thuốc, hệ
 * thống nhà thuốc, góc sức khoẻ) thì KHÔNG nằm ở đây — chúng là route riêng.
 */
export type PageSection = {
  title: string;
  body?: string[];
  /** Gạch đầu dòng. Mục nào có cả `body` thì chữ đứng trước, danh sách theo sau. */
  list?: string[];
};

export type StaticPage = {
  slug: string;
  title: string;
  lead: string;
  sections: PageSection[];
};

export const staticPages: StaticPage[] = [
  {
    slug: "gioi-thieu",
    title: "Giới thiệu MediVia",
    lead: `Nhà thuốc trực tuyến đạt chuẩn GPP, vận hành cùng ${site.pharmacyCount.toLocaleString("vi-VN")} nhà thuốc trên toàn quốc.`,
    sections: [
      {
        title: "Chúng tôi làm gì",
        body: [
          "MediVia bán thuốc và sản phẩm chăm sóc sức khoẻ trực tuyến, giao tận nhà, kèm dược sĩ đại học tư vấn miễn phí. Mỗi đơn thuốc đều được dược sĩ kiểm tra trước khi soạn hàng.",
        ],
      },
      {
        title: "Vì sao có AI ở đây",
        body: [
          "Phần lớn người mua thuốc không biết mô tả triệu chứng của mình thành tên thuốc. Sáu công cụ AI của MediVia lấp đúng khoảng đó: người dùng nói triệu chứng, chụp vỉ thuốc hoặc đọc tên hoạt chất, hệ thống tra cứu rồi đưa ra gợi ý.",
          "AI chỉ tra cứu và gợi ý. Không chẩn đoán, không kê đơn, không thay thế dược sĩ. Mọi nội dung do AI tạo đều được đánh dấu và có đường dẫn chuyển sang dược sĩ thật.",
        ],
      },
      {
        title: "Cam kết",
        list: [
          "Thuốc có nguồn gốc rõ ràng, đầy đủ hoá đơn và tem chống giả.",
          "Dược sĩ trực 24/7, tư vấn miễn phí qua tổng đài và chat.",
          "Không bán thuốc kê đơn khi chưa có đơn hợp lệ của bác sĩ.",
          "Đổi trả trong 30 ngày với sản phẩm còn nguyên bao bì.",
        ],
      },
      {
        title: "Thông tin pháp lý",
        list: [
          `Giấy phép kinh doanh dược số ${site.licenseNumber}.`,
          `Người chịu trách nhiệm chuyên môn: ${site.professionalManager}.`,
          `Địa chỉ: ${site.address}.`,
          `Tổng đài: ${site.hotline}.`,
        ],
      },
    ],
  },

  {
    slug: "lien-he",
    title: "Liên hệ",
    lead: "Bốn cách để gặp dược sĩ hoặc bộ phận chăm sóc khách hàng của MediVia.",
    sections: [
      {
        title: "Tổng đài dược sĩ",
        body: [
          `Gọi ${site.hotline} — miễn phí, trực 24/7 kể cả ngày lễ. Dược sĩ đại học trả lời trực tiếp, không qua tổng đài viên.`,
          "Đây là kênh nên dùng khi cần gấp: hỏi liều, hỏi cách dùng, hoặc báo một phản ứng bất thường sau khi uống thuốc.",
        ],
      },
      {
        title: "Chat với dược sĩ AI",
        body: [
          "Chatbot trả lời ngay các câu hỏi tra cứu thường gặp. Khi câu hỏi vượt quá phạm vi tra cứu — ví dụ liều cho trẻ nhỏ hoặc thuốc đang dùng — hệ thống chuyển thẳng hồ sơ sang dược sĩ thật.",
        ],
      },
      {
        title: "Ghé nhà thuốc",
        body: [
          `Trụ sở: ${site.address}.`,
          "Xem danh sách nhà thuốc và giờ mở cửa ở trang Hệ thống nhà thuốc.",
        ],
      },
      {
        title: "Gửi thư",
        list: [
          "Hợp tác và tuyển dụng: tuyendung@medivia.vn",
          "Khiếu nại chất lượng dịch vụ: hotro@medivia.vn",
          "Báo lỗi nội dung do AI tạo: ai@medivia.vn",
        ],
      },
    ],
  },

  {
    slug: "tuyen-dung",
    title: "Tuyển dụng",
    lead: "MediVia tuyển dược sĩ, điều dưỡng và kỹ sư — làm việc tại TP.HCM hoặc từ xa.",
    sections: [
      {
        title: "Vị trí đang mở",
        list: [
          "Dược sĩ tư vấn trực tổng đài — ca linh hoạt, ưu tiên có chứng chỉ hành nghề.",
          "Dược sĩ kiểm duyệt đơn kê đơn — kiểm tra đơn bác sĩ trước khi soạn hàng.",
          "Kỹ sư phần mềm (Next.js) — phát triển nền tảng bán hàng và công cụ AI.",
          "Chuyên viên kiểm duyệt nội dung y khoa — đọc và duyệt nội dung do AI tổng hợp.",
        ],
      },
      {
        title: "Chúng tôi tìm gì",
        list: [
          "Có chứng chỉ hành nghề dược với các vị trí chuyên môn.",
          "Cẩn thận với chi tiết — sai một liều là sai cả đơn.",
          "Sẵn sàng nói “cái này cần bác sĩ” thay vì bán cho xong.",
        ],
      },
      {
        title: "Cách ứng tuyển",
        body: [
          "Gửi CV kèm vị trí mong muốn tới tuyendung@medivia.vn. Chúng tôi phản hồi trong 5 ngày làm việc.",
        ],
      },
    ],
  },

  {
    slug: "huong-dan-mua-thuoc",
    title: "Hướng dẫn mua thuốc",
    lead: "Bốn bước từ lúc chọn thuốc tới lúc nhận hàng, kèm những chỗ cần lưu ý.",
    sections: [
      {
        title: "Bốn bước đặt thuốc",
        list: [
          "Tìm thuốc — gõ tên thuốc, tên hoạt chất, hoặc mô tả triệu chứng vào ô tìm kiếm. Không nhớ tên cũng được.",
          "Chọn đơn vị và số lượng — mỗi thuốc bán theo hộp, vỉ hoặc viên với giá khác nhau. Giá mỗi viên hiển thị ngay dưới giá hộp để so được.",
          "Kiểm tra giỏ hàng — hệ thống tự đối soát các thuốc trong giỏ và cảnh báo nếu có nguy cơ trùng hoạt chất hoặc tương tác.",
          "Chọn hình thức nhận và thanh toán — giao nhanh 2 giờ, giao tiêu chuẩn, hoặc nhận tại nhà thuốc.",
        ],
      },
      {
        title: "Thuốc kê đơn thì khác gì",
        body: [
          "Thuốc có nhãn đỏ “Cần đơn bác sĩ” không đặt hàng trực tiếp được. Bạn tải ảnh đơn của bác sĩ ở bước thanh toán, dược sĩ gọi xác nhận trong 15 phút rồi mới soạn hàng.",
          "Không có đơn? Dùng công cụ Tư vấn triệu chứng để được gợi ý phương án không kê đơn, hoặc gọi tổng đài để dược sĩ hướng dẫn đi khám.",
        ],
      },
      {
        title: "Kiểm tra hàng khi nhận",
        list: [
          "Đối chiếu tên thuốc, số lô và hạn dùng với hoá đơn trước khi trả tiền.",
          "Với đơn có thuốc kê đơn, kiểm tra nhãn còn nguyên và hộp chưa bị bóc.",
          "Phát hiện sai sót thì gọi ngay tổng đài — đổi lại miễn phí, không cần giải thích.",
        ],
      },
      {
        title: "Bảo quản sau khi nhận",
        body: [
          "Phần lớn thuốc giữ ở nhiệt độ dưới 30°C, tránh ánh sáng trực tiếp và tránh nơi ẩm như nhà tắm. Thuốc cần lạnh được ghi rõ trên từng trang sản phẩm và giao kèm túi giữ nhiệt.",
        ],
      },
    ],
  },

  {
    slug: "chinh-sach-van-chuyen",
    title: "Chính sách vận chuyển",
    lead: "Ba hình thức nhận hàng, phí và thời gian cụ thể cho từng hình thức.",
    sections: [
      {
        title: "Giao nhanh 2 giờ",
        list: [
          "Phí 25.000 ₫ cho mọi đơn.",
          "Đặt trước 19:00 sẽ nhận trong ngày, muộn nhất 21:00.",
          "Áp dụng trong nội thành TP.HCM và Hà Nội.",
        ],
      },
      {
        title: "Giao tiêu chuẩn",
        list: [
          "Miễn phí vận chuyển cho mọi đơn.",
          "Dự kiến nhận sau 1–2 ngày làm việc.",
          "Áp dụng toàn quốc.",
        ],
      },
      {
        title: "Nhận tại nhà thuốc",
        list: [
          "Không mất phí.",
          "Hàng sẵn sau 30 phút, giữ trong 24 giờ.",
          "Cần mang theo số điện thoại đặt hàng để nhận.",
        ],
      },
      {
        title: "Lưu ý về nhiệt độ",
        body: [
          "Thuốc cần bảo quản lạnh được giao trong túi giữ nhiệt và chỉ áp dụng hình thức giao nhanh hoặc nhận tại nhà thuốc. Với hình thức giao tiêu chuẩn, sản phẩm này sẽ bị loại khỏi đơn và bộ phận chăm sóc khách hàng sẽ gọi thông báo.",
        ],
      },
    ],
  },

  {
    slug: "chinh-sach-doi-tra",
    title: "Chính sách đổi trả",
    lead: "Đổi trả trong 30 ngày. Thuốc kê đơn và hàng đã bóc niêm phong không áp dụng.",
    sections: [
      {
        title: "Điều kiện đổi trả",
        list: [
          "Trong vòng 30 ngày kể từ ngày nhận hàng.",
          "Sản phẩm còn nguyên hộp, nguyên niêm phong, chưa qua sử dụng.",
          "Có hoá đơn hoặc mã đơn hàng tra được trên hệ thống.",
        ],
      },
      {
        title: "Không áp dụng với",
        list: [
          "Thuốc kê đơn — theo quy định, thuốc đã xuất khỏi kho bán lẻ không được nhập lại.",
          "Sản phẩm đã bóc niêm phong vì lý do vệ sinh.",
          "Sản phẩm bảo quản lạnh sau khi đã giao khỏi nhà thuốc.",
        ],
      },
      {
        title: "Trường hợp MediVia chịu toàn bộ phí",
        body: [
          "Giao sai thuốc, sai số lượng, hàng hỏng do vận chuyển hoặc hàng hết hạn. Bạn gọi tổng đài, chúng tôi thu hồi và gửi lại đúng hàng — không mất thêm chi phí.",
        ],
      },
      {
        title: "Thời gian hoàn tiền",
        body: [
          "Sau khi nhận lại hàng và kiểm tra, MediVia hoàn tiền trong 3–5 ngày làm việc. Đơn thanh toán khi nhận hàng được hoàn qua chuyển khoản theo số tài khoản bạn cung cấp.",
        ],
      },
    ],
  },

  {
    slug: "faq",
    title: "Câu hỏi thường gặp",
    lead: "Những câu dược sĩ MediVia nhận nhiều nhất, xếp theo thứ tự hay hỏi.",
    sections: [
      {
        title: "Tôi không biết mình cần thuốc gì thì làm sao?",
        body: [
          "Vào Tư vấn triệu chứng, mô tả cảm giác của bạn bằng lời thường — “ho khan 3 ngày, hơi rát cổ” cũng đủ. Hệ thống trả về nhóm thuốc không kê đơn phù hợp kèm lý do, hoặc cảnh báo dấu hiệu cần đi khám ngay.",
        ],
      },
      {
        title: "Thuốc kê đơn có đặt hàng được không?",
        body: [
          "Được, nhưng cần ảnh đơn của bác sĩ. Bạn vẫn chọn được thuốc và lên đơn, tới bước thanh toán thì tải ảnh đơn lên. Dược sĩ gọi xác nhận trong 15 phút trước khi soạn hàng.",
        ],
      },
      {
        title: "Gợi ý của AI có đáng tin không?",
        body: [
          "AI dùng để tra cứu, không để chẩn đoán. Nó đối chiếu mô tả của bạn với cơ sở dữ liệu hoạt chất và trả về các phương án không kê đơn, kèm mức độ chắc chắn. Mọi kết quả đều có nút chuyển sang dược sĩ thật, và bạn nên dùng nút đó khi triệu chứng kéo dài hơn vài ngày.",
        ],
      },
      {
        title: "Uống hai thuốc cùng lúc có sao không?",
        body: [
          "Tuỳ cặp thuốc. Trước khi mua, dùng Kiểm tra tương tác thuốc — nhập tên các thuốc đang dùng, hệ thống đối soát và phân loại mức độ. Giỏ hàng cũng tự cảnh báo nếu phát hiện trùng hoạt chất giữa các sản phẩm bạn vừa chọn.",
        ],
      },
      {
        title: "Đơn hàng của tôi đang ở đâu?",
        body: [
          "Tra ở trang Tra cứu đơn hàng bằng mã đơn hoặc số điện thoại đặt hàng. Trạng thái cập nhật tới từng bước: đã tiếp nhận, dược sĩ đã xác nhận, đang giao, đã giao.",
        ],
      },
      {
        title: "Thực phẩm bổ sung có thay được thuốc không?",
        body: [
          "Không. Thực phẩm bảo vệ sức khoẻ không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh. Sản phẩm thuộc nhóm này luôn hiển thị khuyến cáo đó trên trang chi tiết.",
        ],
      },
    ],
  },

  {
    slug: "chinh-sach-bao-mat",
    title: "Chính sách bảo mật",
    lead: "MediVia thu thập gì, dùng để làm gì, và ai được xem.",
    sections: [
      {
        title: "Dữ liệu chúng tôi thu thập",
        list: [
          "Thông tin đặt hàng: tên, số điện thoại, địa chỉ giao hàng.",
          "Thông tin sức khoẻ bạn tự nhập: triệu chứng mô tả cho công cụ AI, ảnh đơn thuốc, danh sách thuốc đang dùng.",
          "Dữ liệu kỹ thuật: loại thiết bị, trang đã xem, để hệ thống chạy ổn định.",
        ],
      },
      {
        title: "Dữ liệu sức khoẻ được xử lý riêng",
        body: [
          "Đây là nhóm dữ liệu nhạy cảm nhất và MediVia xử lý nó khác phần còn lại: triệu chứng bạn mô tả và ảnh đơn thuốc không bao giờ nằm trong đường dẫn trang, không hiện lại trên màn hình sau khi gửi, và không dùng cho quảng cáo.",
          "Ảnh đơn thuốc chỉ dược sĩ kiểm duyệt đơn xem được, và được xoá sau khi đơn hoàn tất.",
        ],
      },
      {
        title: "Chúng tôi không làm gì",
        list: [
          "Không bán dữ liệu khách hàng cho bên thứ ba.",
          "Không dùng thông tin sức khoẻ để chạy quảng cáo.",
          "Không gửi thông tin đơn thuốc qua email hoặc tin nhắn không mã hoá.",
        ],
      },
      {
        title: "Quyền của bạn",
        body: [
          "Bạn yêu cầu xem, sửa hoặc xoá dữ liệu cá nhân bất cứ lúc nào bằng cách gọi tổng đài hoặc gửi thư tới hotro@medivia.vn. Yêu cầu xoá được xử lý trong 7 ngày làm việc, trừ dữ liệu hoá đơn mà pháp luật buộc phải lưu.",
        ],
      },
    ],
  },

  {
    slug: "dieu-khoan-su-dung",
    title: "Điều khoản sử dụng",
    lead: "Điều kiện áp dụng khi bạn dùng website và mua thuốc tại MediVia.",
    sections: [
      {
        title: "Phạm vi",
        body: [
          "Website này do MediVia vận hành. Khi đặt hàng, bạn đồng ý với các điều khoản dưới đây cùng chính sách bảo mật và chính sách đổi trả.",
        ],
      },
      {
        title: "Điều kiện mua thuốc",
        list: [
          "Người đặt thuốc phải từ 18 tuổi trở lên.",
          "Thông tin đặt hàng phải chính xác — địa chỉ sai có thể làm đơn bị huỷ.",
          "Thuốc kê đơn chỉ được bán khi có đơn hợp lệ của bác sĩ. MediVia có quyền từ chối bán nếu nghi ngờ đơn không hợp lệ.",
          "Không đặt số lượng lớn bất thường cho một cá nhân.",
        ],
      },
      {
        title: "Nội dung do AI tạo",
        body: [
          "Các công cụ AI trên MediVia đưa ra thông tin tham khảo dựa trên dữ liệu bạn nhập. Kết quả có thể chưa đầy đủ hoặc chưa phù hợp với tình trạng cụ thể của bạn. Nội dung này không phải chẩn đoán, không phải chỉ định, và không thay thế bác sĩ hoặc dược sĩ.",
          "Bạn tự quyết định việc dùng thuốc sau khi đã tham khảo ý kiến chuyên môn. Khi có dấu hiệu bất thường, hãy đi khám thay vì tiếp tục tự dùng thuốc.",
        ],
      },
      {
        title: "Trách nhiệm của MediVia",
        list: [
          "Cung cấp thuốc đúng nguồn gốc, còn hạn dùng, đúng như mô tả trên trang sản phẩm.",
          "Kiểm tra đơn thuốc kê đơn trước khi giao.",
          "Bồi thường theo chính sách đổi trả nếu giao sai hoặc hàng hỏng.",
        ],
      },
      {
        title: "Thay đổi điều khoản",
        body: [
          "MediVia có thể cập nhật điều khoản này. Bản đang áp dụng là bản hiển thị trên website tại thời điểm bạn đặt hàng.",
        ],
      },
    ],
  },

  {
    slug: "quy-dinh-thuoc-ke-don",
    title: "Quy định bán thuốc kê đơn",
    lead: "Vì sao có thuốc không đặt hàng trực tiếp được, và MediVia xử lý đơn kê đơn thế nào.",
    sections: [
      {
        title: "Vì sao phải có đơn bác sĩ",
        body: [
          "Thuốc kê đơn chỉ an toàn khi dùng đúng chỉ định, đúng liều và đúng thời gian. Bán không đơn là để người dùng tự đoán bệnh và tự chọn liều — chính là cách kháng sinh mất tác dụng và các tương tác nguy hiểm xảy ra.",
          "Vì vậy thuốc thuộc nhóm này mang nhãn đỏ trên MediVia. Chúng vẫn thêm được vào giỏ như thuốc thường, nhưng đơn không rời khỏi bước xác nhận cho tới khi dược sĩ duyệt ảnh đơn của bác sĩ.",
        ],
      },
      {
        title: "Cách mua thuốc kê đơn tại MediVia",
        list: [
          "Chọn thuốc như bình thường — đơn sẽ đánh dấu là cần đơn bác sĩ.",
          "Tới bước thanh toán, tải ảnh đơn thuốc do bác sĩ kê. Nhận JPG, PNG hoặc PDF dưới 10 MB.",
          "Dược sĩ gọi xác nhận trong khoảng 15 phút. Đơn chỉ được soạn sau khi xác nhận xong.",
          "Ảnh đơn nằm trong kho riêng, chỉ dược sĩ duyệt đơn mở được, và bị xoá sau khi đơn hoàn tất.",
        ],
      },
      {
        title: "Đơn bị từ chối khi nào",
        body: [
          "Bốn trường hợp thường gặp nhất là: ảnh mờ, thiếu phần chẩn đoán hoặc thiếu chữ ký bác sĩ; đơn đã quá hạn sử dụng theo ghi chú trên đơn; số lượng thuốc trên đơn ít hơn số lượng đặt; thuốc trên đơn không khớp với thuốc trong giỏ.",
          "Dược sĩ ghi lý do ngay trên đơn, và lý do hiện nguyên văn khi bạn tra cứu đơn hàng — không phải câu chung chung. Có lý do rồi thì gửi lại ảnh đơn đã sửa hoặc gọi tổng đài.",
        ],
      },
      {
        title: "Nếu chưa có đơn",
        body: [
          "Dùng công cụ Tư vấn triệu chứng để xem có phương án không kê đơn phù hợp không, hoặc gọi tổng đài để dược sĩ hướng dẫn. Với nhiều trường hợp — sốt cao kéo dài, đau ngực, khó thở — câu trả lời đúng là đi khám, và MediVia sẽ nói thẳng như vậy.",
        ],
      },
    ],
  },
];

export function getStaticPage(slug: string): StaticPage | undefined {
  return staticPages.find((page) => page.slug === slug);
}