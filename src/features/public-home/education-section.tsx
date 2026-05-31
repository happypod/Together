import { EducationApplicationForm } from "@/features/public-home/education-application-form";
import { EducationCalendar, type EducationScheduleItem } from "@/features/public-home/education-calendar";

const educationSchedules: EducationScheduleItem[] = [
  {
    id: "2026-06-08-am-collective",
    courseType: "collective" as const,
    title: "소원권역 동행이동 OS 집체교육",
    date: "2026-06-08",
    time: "오전 10:00",
    target: "주민, 보호자, 동행자",
    place: "소원권역 커뮤니티센터",
    status: "접수 중",
  },
  {
    id: "2026-06-15-pm-collective",
    courseType: "collective" as const,
    title: "동행서비스 이용자 등록 전 집체교육",
    date: "2026-06-15",
    time: "오후 2:00",
    target: "주민, 동행자 포함",
    place: "주민협의체 교육실",
    status: "접수 중",
  },
  {
    id: "2026-06-22-full-linker",
    courseType: "linker-qualification" as const,
    title: "동행링커 역량강화 및 민간자격과정",
    date: "2026-06-22",
    time: "오전 10:00 ~ 오후 4:00",
    target: "동행링커 후보자",
    place: "앵커조직 교육장",
    status: "사전 신청",
  },
];

export function EducationSection() {
  return (
    <section
      className="pub-section pub-section-form pub-detail-section education-section"
      id="education"
      aria-labelledby="education-title"
    >
      <div className="pub-container">
        <div className="pub-section-head">
          <p className="pub-eyebrow">참여자 교육</p>
          <h2 className="pub-section-title" id="education-title">교육 신청과 교육일자 확인</h2>
          <p className="pub-section-desc">
            소원권역 동행이동 OS를 함께 이용하고 운영하기 위한 필수 교육을 확인하고 신청합니다.
          </p>
        </div>

        <div className="education-rule-grid" aria-label="교육 이수 기준">
          <article className="education-rule-card">
            <span className="education-rule-badge">이용자 등록 기준</span>
            <h3>집체교육 이수 후 등록</h3>
            <p>
              기본적으로 동행서비스 이용자는 소원권역 동행이동 OS 집체교육을 이수해야
              등록할 수 있습니다. 집체교육 대상에는 주민과 동행자가 함께 포함됩니다.
            </p>
          </article>
          <article className="education-rule-card education-rule-card--strong">
            <span className="education-rule-badge">동행링커 자격 기준</span>
            <h3>민간자격과정 이수 후 활동</h3>
            <p>
              동행링커는 별도의 민간자격과정을 이수해야 동행자격을 갖추며,
              이수자에 한해 동행링커 활동과 취업연계 지원을 진행합니다.
            </p>
          </article>
        </div>

        {/* ── 교육 캘린더 ── */}
        <section className="education-calendar-section" aria-labelledby="edu-cal-title">
          <div className="education-panel-head">
            <p className="eyebrow">교육 일정 캘린더</p>
            <h3 id="edu-cal-title">날짜로 교육일자를 한눈에 확인하세요</h3>
            <p className="education-panel-desc">
              색상 날짜를 클릭하면 해당 교육 상세 정보를 볼 수 있습니다.
            </p>
          </div>
          <EducationCalendar
            applyAnchor="#education-apply-title"
            schedules={educationSchedules}
          />
        </section>

        <div className="education-detail-grid">
          <section className="education-panel" aria-labelledby="education-schedule-title">
            <div className="section-header compact">
              <p className="eyebrow">교육일자 확인</p>
              <h3 id="education-schedule-title">예정 교육 일정</h3>
            </div>
            <ul className="education-schedule-list">
              {educationSchedules.map((schedule) => (
                <li className="education-schedule-card" key={schedule.id}>
                  <div>
                    <span className="education-course-type">
                      {schedule.courseType === "collective" ? "집체교육" : "민간자격과정"}
                    </span>
                    <strong>{schedule.title}</strong>
                    <span>{schedule.target}</span>
                  </div>
                  <dl>
                    <div>
                      <dt>일자</dt>
                      <dd>{schedule.date}</dd>
                    </div>
                    <div>
                      <dt>시간</dt>
                      <dd>{schedule.time}</dd>
                    </div>
                    <div>
                      <dt>장소</dt>
                      <dd>{schedule.place}</dd>
                    </div>
                  </dl>
                  <mark>{schedule.status}</mark>
                </li>
              ))}
            </ul>
          </section>

          <section className="education-panel" aria-labelledby="education-apply-title">
            <div className="section-header compact">
              <p className="eyebrow">교육 신청 접수</p>
              <h3 id="education-apply-title">참여자 교육 신청</h3>
            </div>
            <EducationApplicationForm
              scheduleOptions={educationSchedules.map((schedule) => ({
                id: schedule.id,
                label: `${schedule.date} ${schedule.time} · ${schedule.title}`,
                courseType: schedule.courseType,
              }))}
            />
          </section>
        </div>
      </div>
    </section>
  );
}
