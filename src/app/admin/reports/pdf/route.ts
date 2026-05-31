import { type NextRequest } from "next/server";
import { AuthorizationError } from "@/domain/auth/permissions";
import { AuthenticationError, requireCurrentUser } from "@/server/auth/guard";
import { exportMonthlyPdf } from "@/server/reports/monthly-pdf-export-service";

export const dynamic = "force-dynamic";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function contentDisposition(filename: string) {
  return [
    `attachment; filename="${filename}"`,
    `filename*=UTF-8''${encodeURIComponent(filename)}`,
  ].join("; ");
}

function errorStatus(error: unknown) {
  if (error instanceof AuthenticationError) {
    return 401;
  }
  if (error instanceof AuthorizationError) {
    return 403;
  }
  return 400;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const user = await requireCurrentUser();
    const result = await exportMonthlyPdf(user, {
      month: value(formData, "month"),
      reason: value(formData, "reason"),
    });

    return new Response(result.pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": contentDisposition(result.filename),
        "Cache-Control": "no-store",
        "X-PDF-Byte-Length": String(result.byteLength),
      },
    });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "PDF를 생성하지 못했습니다.",
      {
        status: errorStatus(error),
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

export function GET() {
  return new Response("PDF 다운로드는 사유 입력 후 실행해 주세요.", {
    status: 405,
    headers: {
      Allow: "POST",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
