"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Mic, Search, Volume2 } from "@/lib/icons";

/**
 * Kiểu tối thiểu cho Web Speech API.
 *
 * Khai báo tại chỗ vì API này không có trong lib DOM tiêu chuẩn của TypeScript —
 * nó là bản triển khai riêng của trình duyệt, chưa thành chuẩn. Chỉ khai báo đúng
 * những gì dùng, không hơn.
 */
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

function getRecognitionConstructor(): (new () => SpeechRecognitionLike) | undefined {
  if (typeof window === "undefined") return undefined;
  const speechWindow = window as SpeechWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

/**
 * Đọc khả năng hỗ trợ micro của trình duyệt.
 *
 * Dùng `useSyncExternalStore` chứ KHÔNG dùng `useState` + `useEffect`. Hai lý do:
 *
 *  1. Không thể đọc trong lúc render thường: `window` không tồn tại trên server, và
 *     nếu server render "không hỗ trợ" rồi client render "có hỗ trợ" thì lệch
 *     hydration. `getServerSnapshot` trả về false giải quyết đúng chỗ này.
 *  2. Đặt `setSupported(true)` trong effect làm React render thêm một lượt ngay sau
 *     lượt đầu (react-hooks/set-state-in-effect báo lỗi). Khả năng hỗ trợ micro là
 *     giá trị ĐỌC từ bên ngoài React, không phải state của component — nên đây đúng
 *     là việc của useSyncExternalStore.
 *
 * `subscribe` trả về hàm rỗng vì giá trị này không bao giờ đổi trong một phiên: trình
 * duyệt không tự mọc thêm Web Speech API giữa lúc dùng.
 */
const noopSubscribe = () => () => {};

function useSpeechSupported(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => getRecognitionConstructor() !== undefined,
    () => false,
  );
}

/**
 * Ô nhận giọng nói.
 *
 * Đây là component client DUY NHẤT trong luồng AI, và chỉ vì micro bắt buộc phải
 * chạy trên máy người dùng. Phần tìm kiếm vẫn nằm ở server: nút "Tìm" gửi form
 * GET như trang /ai/tim-kiem, nên nói và gõ đi qua đúng một bộ tìm kiếm.
 *
 * Ba trạng thái được xử lý riêng, không gộp thành "lỗi":
 *   - trình duyệt không hỗ trợ  → ẩn nút micro, chỉ còn ô gõ
 *   - người dùng từ chối quyền  → nói rõ là quyền micro, kèm cách bật lại
 *   - nghe không ra chữ nào     → mời nói lại, không im lặng
 *
 * Chữ nghe được luôn nằm trong ô SỬA ĐƯỢC. Tiếng Việt có dấu và tên thuốc phần
 * lớn là tiếng nước ngoài, nên nghe sai là chuyện thường — sửa một chữ nhanh hơn
 * nói lại cả câu.
 */
export function VoiceCapture({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const supported = useSpeechSupported();
  const [listening, setListening] = useState(false);
  const [text, setText] = useState(defaultValue);
  const [problem, setProblem] = useState<string>();

  useEffect(() => {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = "vi-VN";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript.trim().length === 0) {
        setProblem("Chưa nghe ra chữ nào. Bạn thử nói lại, gần micro hơn một chút.");
        return;
      }
      setText(transcript);
      setProblem(undefined);
      // Tự tìm ngay sau khi nghe được: người dùng vừa nói xong thì họ đợi kết quả,
      // không đợi thêm một cú bấm nữa.
      router.push(`/ai/giong-noi?noi=${encodeURIComponent(transcript)}`);
    };

    recognition.onerror = (event) => {
      setListening(false);
      setProblem(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Trình duyệt đang chặn micro. Bạn bật lại quyền micro cho trang này, hoặc gõ câu tìm kiếm ở ô dưới."
          : "Micro gặp sự cố. Bạn gõ câu tìm kiếm ở ô dưới cũng cho cùng kết quả.",
      );
    };

    recognition.onend = () => setListening(false);

    // Chỉ gán vào ref, KHÔNG setState: `supported` đã do useSpeechSupported lo.
    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
    };
  }, [router]);

  const toggle = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }

    setProblem(undefined);
    setListening(true);
    recognition.start();
  };

  return (
    <div className="flex flex-col gap-4">
      {supported ? (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            aria-pressed={listening}
            className={
              "focus-ring flex size-24 items-center justify-center rounded-chip transition-colors " +
              (listening
                ? "animate-pulse bg-ai text-white"
                : "bg-ai-wash text-ai-text hover:bg-ai/20")
            }
          >
            <Mic size={34} aria-hidden />
            <span className="sr-only">
              {listening ? "Đang nghe, bấm để dừng" : "Bấm để nói"}
            </span>
          </button>
          <p aria-live="polite" className="text-body-md text-ink-muted">
            {listening ? "Đang nghe… hãy nói tên thuốc hoặc triệu chứng" : "Bấm micro rồi nói"}
          </p>
        </div>
      ) : (
        <p className="flex items-start gap-2 rounded-card bg-recessed p-3 text-body-sm text-ink-muted">
          <Volume2 size={16} className="mt-0.5 shrink-0 text-ink-subtle" aria-hidden />
          Trình duyệt này không nhận giọng nói tiếng Việt. Bạn gõ vào ô dưới —
          kết quả tìm kiếm là như nhau.
        </p>
      )}

      {problem ? (
        <p className="rounded-card border border-promo/30 bg-promo-wash p-3 text-body-sm text-promo-text">
          {problem}
        </p>
      ) : null}

      {/*
        Form GET giống hệt /ai/tim-kiem. Không có JS thì nút micro không hiện
        nhưng ô này vẫn tìm được — tính năng giảm chức năng, không chết hẳn.
      */}
      <form ref={formRef} action="/ai/giong-noi" method="get" className="flex flex-col gap-2">
        <label htmlFor="noi" className="text-label-sm text-ink">
          {supported ? "Chữ nghe được — sửa nếu AI nghe sai" : "Câu tìm kiếm"}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="noi"
            name="noi"
            required
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Ví dụ: thuốc ho cho trẻ em"
            className="sm:flex-1"
          />
          <Button type="submit" variant="solid-ai" className="sm:w-28">
            <Search size={17} aria-hidden />
            Tìm
          </Button>
        </div>
      </form>
    </div>
  );
}
