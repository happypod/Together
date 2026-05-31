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

export async function getPublicHomeView() {
  let settings = DEFAULT_OPERATING_SETTINGS;
  let summary = previewOperationSummary;
  let recruitmentRows = previewRecruitmentRows;
  let notices = previewNotices;
  let feedbacks = previewFeedbacks;
  let calendarMonths: CalendarMonthData[] = makePreviewCalendarMonths();
  let educationSchedules: PublicEducationScheduleItem[] = previewEducationSchedules;

  const now = new Date();
  const baseYear = now.getFullYear();
  const baseMonth = now.getMonth() + 1;

  try {
    const [s, op, rec, not, fb, cal, edu] = await Promise.all([
      getOperatingSettings(),
      getPublicOperationSummary(),
      getPublicRecruitmentSchedules(),
      getPublicNotices(),
      getPublicFeedbacks(),
      getPublicCalendarRange(baseYear, baseMonth),
      listPublicEducationSchedules(),
    ]);
    settings = s;
    summary = op;
    recruitmentRows = rec;
    notices = not.length > 0 ? not : previewNotices;
    feedbacks = fb.length > 0 ? fb : previewFeedbacks;
    calendarMonths = cal;
    educationSchedules = edu.length > 0 ? edu : previewEducationSchedules;
  } catch {
    // DB 연결이 없을 때도 공개 홈이 비어 보이지 않도록 미리보기 데이터를 사용한다.
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
