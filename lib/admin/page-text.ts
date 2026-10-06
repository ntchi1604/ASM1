import type { PageSection } from "@/lib/data/pages";

/**
 * Định dạng chữ cho nội dung trang tĩnh — và là CHỖ DUY NHẤT biết định dạng này.
 *
 * Vì sao không dùng JSON: người sửa trang ở đây là dược sĩ, không phải lập trình
 * viên. Một ô JSON thì mỗi lần sửa là một lần có thể sai dấu phẩy, sai dấu ngoặc,
 * và câu báo lỗi duy nhất nhận được là "không đọc được". Định dạng dưới đây đọc
 * được bằng mắt, và gõ sai thì vẫn ra nội dung chứ không mất trắng.
 *
 * Cú pháp:
 *
 *     ## Tiêu đề mục
 *     Một đoạn văn.
 *     - Một gạch đầu dòng
 *     - Gạch đầu dòng nữa
 *
 * Dòng `##` mở mục mới. Dòng bắt đầu bằng `-` là gạch đầu dòng. Dòng khác rỗng là
 * đoạn văn. Mục không có tiêu đề thì bị bỏ, vì trang render mục bằng tiêu đề.
 */
export function formatSections(sections: PageSection[]): string {
  return sections
    .map((section) => {
      const lines = [`## ${section.title}`];
      if (section.body) lines.push(...section.body);
      if (section.list) lines.push(...section.list.map((item) => `- ${item}`));
      return lines.join("\n");
    })
    .join("\n\n");
}

export function parseSections(text: string): PageSection[] {
  const sections: PageSection[] = [];
  let current: { title: string; body: string[]; list: string[] } | undefined;

  const flush = () => {
    if (!current || !current.title) return;
    sections.push({
      title: current.title,
      ...(current.body.length ? { body: current.body } : {}),
      ...(current.list.length ? { list: current.list } : {}),
    });
  };

  for (const raw of text.split("\n")) {
    const line = raw.trim();

    if (line.startsWith("##")) {
      flush();
      current = { title: line.slice(2).trim(), body: [], list: [] };
    } else if (!current) {
      // Chữ nằm trước mục đầu tiên không thuộc về đâu cả. Bỏ qua thay vì dồn vào
      // mục đầu: dồn vào thì sửa nhầm một dòng là nội dung nhảy sang mục khác.
      continue;
    } else if (line.startsWith("-")) {
      const item = line.slice(1).trim();
      if (item) current.list.push(item);
    } else if (line) {
      current.body.push(line);
    }
  }
  flush();

  return sections;
}
