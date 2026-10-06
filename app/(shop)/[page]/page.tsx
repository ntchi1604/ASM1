import { notFound } from "next/navigation";
import { ContentList, ContentPage, ContentSection } from "@/components/layout/ContentPage";
import { getStaticPage, staticPages } from "@/lib/data/pages";

/**
 * Mười trang chữ của site (giới thiệu, liên hệ, tuyển dụng, 4 trang chính sách,
 * hướng dẫn mua thuốc, FAQ, quy định thuốc kê đơn) dùng CHUNG một route động.
 *
 * Mỗi trang là chữ, cùng một bố cục, không có gì để tự quyết — tách thành mười
 * thư mục `page.tsx` thì được mười bản gần giống nhau, và sau này sửa tiêu đề một
 * chỗ là mười chỗ lệch dần. Nội dung nằm ở `lib/data/pages.ts`.
 *
 * `dynamicParams = false` là phần bắt buộc: không có nó thì route động này nhận
 * MỌI đường dẫn một cấp chưa được định nghĩa ở chỗ khác, và thay vì 404 người
 * dùng sẽ thấy một trang trắng. Các route tĩnh một cấp (`/gio-hang`,
 * `/thanh-toan`, `/goc-suc-khoe`, `/he-thong-nha-thuoc`…) vẫn thắng route này vì
 * Next xếp segment tĩnh trước segment động.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return staticPages.map((page) => ({ page: page.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[page]">) {
  const { page: slug } = await params;
  const page = getStaticPage(slug);
  if (!page) return { title: "Không tìm thấy trang" };
  // Không thêm "MediVia" ở đây: layout gốc đã có template "%s · MediVia".
  return { title: page.title, description: page.lead };
}

export default async function StaticPage({ params }: PageProps<"/[page]">) {
  const { page: slug } = await params;
  const page = getStaticPage(slug);
  if (!page) notFound();

  return (
    <ContentPage title={page.title} lead={page.lead}>
      {page.sections.map((section) => (
        <ContentSection key={section.title} title={section.title}>
          {section.body?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.list ? <ContentList items={section.list} /> : null}
        </ContentSection>
      ))}
    </ContentPage>
  );
}