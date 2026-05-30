export const dashboardMetrics = [
  {
    label: "오늘 신청",
    value: "0건",
    detail: "접수 대기 없음",
  },
  {
    label: "공동예약",
    value: "0그룹",
    detail: "배정 대기 없음",
  },
  {
    label: "귀가 확인",
    value: "0건",
    detail: "확인 대기 없음",
  },
  {
    label: "정산 대기",
    value: "0건",
    detail: "영수증 대기 없음",
  },
] as const;

export const todayTasks = [
  {
    state: "준비",
    title: "주민 신청 확인",
    description: "접수된 이동 신청의 연락처와 희망 일정을 확인합니다.",
    tone: "neutral",
  },
  {
    state: "대기",
    title: "공동예약 그룹 구성",
    description: "이동 방향과 시간대가 맞는 주민을 최대 3명까지 묶습니다.",
    tone: "warning",
  },
  {
    state: "대기",
    title: "동행링커 배정",
    description: "배정 가능한 동행링커와 택시 요청 상태를 함께 확인합니다.",
    tone: "info",
  },
  {
    state: "확인",
    title: "귀가와 정산 기록",
    description: "귀가 확인, 요금, 영수증 링크, 앵커 지원금을 빠짐없이 남깁니다.",
    tone: "success",
  },
] as const;

export const settlementRows = [
  {
    label: "리포트 기준",
    value: "serviceDate",
    note: "월간 집계 기본값",
  },
  {
    label: "원 단위 처리",
    value: "FLOOR",
    note: "잔여 금액은 앵커 지원금 반영",
  },
  {
    label: "영수증",
    value: "URL 기록",
    note: "P0는 외부 저장 링크 기준",
  },
] as const;
