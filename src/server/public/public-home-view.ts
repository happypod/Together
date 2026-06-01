import { unstable_cache } from "next/cache";
import { getKoreaYearMonth } from "@/domain/korea-date";
import {
  getPublicFeedbacks,
  getPublicNotices,
  getPublicOperationSummary,
  getPublicRecruitmentSchedules,
  previewFeedbacks,
  previewNotices,
  previewOperationSummary,
  previewRecruitmentRows,
} from "@/server/public/public-home-service";
import {
  getPublicCalendarRange,
  makePreviewCalendarMonths,
  type CalendarMonthData,
} from "@/server/public/public-calendar-service";
import {
  listPublicEducationSchedules,
  previewEducationSchedules,
  type PublicEducationScheduleItem,
} from "@/server/public/education-schedule-service";
import { DEFAULT_OPERATING_SETTINGS } from "@/server/settings/defaults";
import { getOperatingSettings } from "@/server/settings/settings-service";

/** DB가 멈추거나 응답이 느릴 때 공개 홈이 통째로 지연되지 않도록 하는 상한선(ms). */
const PUBLIC_DB_TIMEOUT_MS = 1500;

/** 공개 홈 데이터 재사용(캐시) 유지 시간(초). 반복 메뉴 이동 시 매번 재조회하지 않는다. */
const PUBLIC_VIEW_REVALIDATE_SECONDS = 30;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("public-db-timeout")), ms),
    ),
  ]);
}

/** DB에서 공개 홈 데이터를 모은다. DB가 없거나 느리면 즉시 미리보기 데이터로 폴백한다. */
async function loadPublicHomeView() {
  let settings = DEFAULT_OPERATING_SETTINGS;
  let summary = previewOperationSummary;
  let recruitmentRows = previewRecruitmentRows;
  let notices = previewNotices;
  let feedbacks = previewFeedbacks;
  let calendarMonths: CalendarMonthData[] = makePreviewCalendarMonths();
  let educationSchedules: PublicEducationScheduleItem[] = previewEducationSchedules;

  const { year: baseYear, month: baseMonth } = getKoreaYearMonth();

  try {
    const [s, op, rec, not, fb, cal, edu] = await withTimeout(
      Promise.all([
        getOperatingSettings(),
        getPublicOperationSummary(),
        getPublicRecruitmentSchedules(),
        getPublicNotices(),
        getPublicFeedbacks(),
        getPublicCalendarRange(baseYear, baseMonth),
        listPublicEducationSchedules(),
      ]),
      PUBLIC_DB_TIMEOUT_MS,
    );
    settings = s;
    summary = op;
    recruitmentRows = rec;
    notices = not.length > 0 ? not : previewNotices;
    feedbacks = fb.length > 0 ? fb : previewFeedbacks;
    calendarMonths = cal;
    educationSchedules = edu.length > 0 ? edu : previewEducationSchedules;
  } catch {
    // DB 연결이 없거나 느릴 때도 공개 홈이 비어 보이지 않도록 미리보기 데이터를 사용한다.
  }

  return {
    calendarMonths,
    educationSchedules,
    feedbacks,
    notices,
    recruitmentRows,
    settings,
    summary,
  };
}

/**
 * 공개 홈 데이터를 30초 캐시한다.
 * 첫 요청만 DB를 조회하고, 이후 반복 메뉴 이동은 캐시에서 즉시 응답한다.
 * (force-dynamic 페이지에서도 unstable_cache는 독립적으로 동작한다.)
 */
export const getPublicHomeView = unstable_cache(
  loadPublicHomeView,
  ["public-home-view"],
  { revalidate: PUBLIC_VIEW_REVALIDATE_SECONDS, tags: ["public-home"] },
);
