import { searchProducts, type SearchResult } from "./search";
import { thinkingDelay } from "./engine";

export type VoiceResult = {
  /** Câu AI nghe được, nguyên văn. */
  transcript: string;
  /** Độ chắc của phần NGHE — khác với độ chắc của phần tìm. */
  transcriptConfidence: number;
  /** Kết quả tìm kiếm dựng từ câu nghe được. */
  search: SearchResult;
};

/**
 * Tính năng 9 — Tìm thuốc bằng giọng nói.
 *
 * Tính năng này KHÔNG có bộ tìm kiếm riêng. Nó chỉ làm một việc: chuyển giọng
 * nói thành chữ, rồi đưa chữ đó cho `searchProducts` — cùng hàm mà trang
 * /ai/tim-kiem dùng. Nếu nói và gõ cùng một câu mà ra hai kết quả khác nhau thì
 * người dùng sẽ không tin cái nào cả.
 *
 * Hai độ chắc được tách riêng vì hai loại lỗi khác nhau: nghe sai tên thuốc là
 * lỗi của phần nhận dạng giọng nói, tìm không ra là lỗi của phần tìm. Trang hiện
 * câu nghe được ở dạng SỬA ĐƯỢC — người dùng sửa chữ rồi tìm lại, không phải nói
 * lại từ đầu. Tiếng Việt có dấu, và tên thuốc thì phần lớn là tiếng nước ngoài;
 * nghe sai là chuyện thường, nên đường sửa phải có sẵn.
 */
export async function searchByVoice(transcript: string): Promise<VoiceResult> {
  await thinkingDelay(700);

  const search = await searchProducts(transcript);

  return {
    transcript,
    transcriptConfidence: estimateTranscriptConfidence(transcript),
    search,
  };
}

/**
 * Độ chắc của phần nghe.
 *
 * Câu càng ngắn và càng nhiều từ lạ thì càng dễ nghe sai — một từ "Efferalgan"
 * đứng một mình khó hơn hẳn một câu "thuốc hạ sốt cho người lớn".
 */
function estimateTranscriptConfidence(transcript: string) {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  if (words.length === 1) return 71;
  if (words.length <= 3) return 84;
  return 93;
}

/** Câu mẫu để người dùng biết nói kiểu gì thì máy hiểu. */
export const voiceExamples = [
  "Thuốc hạ sốt cho trẻ em",
  "Thuốc ho không gây buồn ngủ",
  "Vitamin C dưới 100 nghìn",
  "Nước muối sinh lý rửa mũi",
];

/**
 * Kịch bản nghe sẵn cho bản demo.
 *
 * Trình duyệt có Web Speech API nhưng hỗ trợ tiếng Việt không đồng đều, và bản
 * demo cần chạy được cả khi người xem không cho quyền micro. Trang thật vẫn xin
 * quyền micro trước; đây là đường lùi, không phải đường chính.
 */
export const voiceDemoTranscript = "thuốc ho cho trẻ em không gây buồn ngủ";
