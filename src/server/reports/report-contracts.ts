export type PrivacyLevel = "public" | "masked" | "restricted";

export type MetricContract = {
  key: string;
  label: string;
  formula: string;
  source: string;
};

export type CsvColumnContract = {
  key: string;
  label: string;
  source: string;
  privacy: PrivacyLevel;
  note: string;
};

export const DASHBOARD_KPIS: MetricContract[] = [
  {
    key: "todayRequestCount",
    label: "오늘 신청",
    formula: "desiredDate가 오늘이고 취소되지 않은 MobilityRequest 수",
    source: "MobilityRequest",
  },
  {
    key: "todayGroupCount",
    label: "오늘 공동예약",
    formula: "serviceDate가 오늘이고 삭제되지 않은 MobilityGroup 수",
    source: "MobilityGroup",
  },
  {
    key: "returnConfirmedCount",
    label: "성과 확정",
    formula: "RETURN_CONFIRMED, SETTLED, REPORTED 상태의 MobilityGroup 수",
    source: "MobilityGroup",
  },
  {
    key: "unsettledCount",
    label: "정산 대기",
    formula: "성과 확정 그룹 중 정산이 없거나 isSettled가 false인 건수",
    source: "MobilityGroup, Settlement",
  },
  {
    key: "activeLinkerCount",
    label: "활동 가능 링커",
    formula: "AVAILABLE 또는 ACTIVE 상태의 Linker 수",
    source: "Linker",
  },
];

export const MONTHLY_REPORT_METRICS: MetricContract[] = [
  {
    key: "tripCount",
    label: "월 운행건수",
    formula: "해당 월 RETURN_CONFIRMED 이상 그룹 수",
    source: "MobilityGroup.status",
  },
  {
    key: "monthlyResidentCount",
    label: "월 이용 주민 수",
    formula: "해당 월 운행 완료 그룹의 고유 주민 수",
    source: "MobilityGroupMember.residentId",
  },
  {
    key: "cumulativeResidentCount",
    label: "누적 이용 주민 수",
    formula: "서비스 시작 이후 운행 완료 그룹의 고유 주민 수",
    source: "MobilityGroupMember.residentId",
  },
  {
    key: "linkerActivityCount",
    label: "월 동행링커 활동건수",
    formula: "해당 월 링커가 배정된 운행 완료 그룹 수",
    source: "MobilityGroup.linkerId",
  },
  {
    key: "activeLinkerCount",
    label: "활동 동행링커 수",
    formula: "해당 월 1건 이상 배정된 고유 linkerId 수",
    source: "MobilityGroup.linkerId",
  },
  {
    key: "averageFare",
    label: "평균 택시요금",
    formula: "해당 월 정산 완료 건의 totalFare 평균",
    source: "Settlement.totalFare",
  },
  {
    key: "totalAnchorSupport",
    label: "총 이동지원비",
    formula: "해당 월 anchorSupportAmount 합계",
    source: "Settlement.anchorSupportAmount",
  },
  {
    key: "averageResidentShare",
    label: "주민 1인 평균 분담액",
    formula: "해당 월 residentPerPersonShare 평균",
    source: "Settlement.residentPerPersonShare",
  },
  {
    key: "satisfactionAverage",
    label: "만족도 평균",
    formula: "이용자, 링커, 택시 만족도 항목 평균",
    source: "SatisfactionSurvey",
  },
  {
    key: "emotionalRecoveryAverage",
    label: "정서회복 평균",
    formula: "참여자 정서회복 응답(1~5) 평균",
    source: "SatisfactionSurvey.emotionalRecovery",
  },
  {
    key: "incidentComplaintCount",
    label: "사고·민원 건수",
    formula: "해당 월 IncidentReport 수",
    source: "IncidentReport",
  },
  {
    key: "communityFundAmount",
    label: "상생기금 조성액",
    formula: "해당 월 CommunityFund CONTRIBUTION 합계",
    source: "CommunityFund",
  },
  {
    key: "jobConsultationCount",
    label: "취업연계 상담 건수",
    formula: "해당 월 JobConsultation 기록 수",
    source: "JobConsultation.consultedAt",
  },
  {
    key: "mouCount",
    label: "MOU 수",
    formula: "해당 월 체결일 기준 MouRecord 수",
    source: "MouRecord.signedAt",
  },
];

export const MONTHLY_SUMMARY_CSV_COLUMNS: CsvColumnContract[] = [
  {
    key: "month",
    label: "월",
    source: "MonthlyReport.month",
    privacy: "public",
    note: "YYYY-MM 형식",
  },
  {
    key: "tripCount",
    label: "월 운행건수",
    source: "MonthlyReport.tripCount",
    privacy: "public",
    note: "성과 확정 건수",
  },
  {
    key: "monthlyResidentCount",
    label: "월 이용 주민 수",
    source: "MonthlyReport.monthlyResidentCount",
    privacy: "public",
    note: "고유 주민 수",
  },
  {
    key: "activeLinkerCount",
    label: "활동 동행링커 수",
    source: "MonthlyReport.activeLinkerCount",
    privacy: "public",
    note: "고유 링커 수",
  },
  {
    key: "averageFare",
    label: "평균 택시요금",
    source: "MonthlyReport.averageFare",
    privacy: "public",
    note: "원 단위 정수",
  },
  {
    key: "totalAnchorSupport",
    label: "총 이동지원비",
    source: "MonthlyReport.totalAnchorSupport",
    privacy: "public",
    note: "상생기금 조성액과 구분",
  },
  {
    key: "averageResidentShare",
    label: "주민 1인 평균 분담액",
    source: "MonthlyReport.averageResidentShare",
    privacy: "public",
    note: "정산 반올림 정책 반영 후 평균",
  },
  {
    key: "satisfactionAverage",
    label: "만족도 평균",
    source: "MonthlyReport.satisfactionAverage",
    privacy: "public",
    note: "1~5점",
  },
  {
    key: "incidentComplaintCount",
    label: "사고·민원 건수",
    source: "MonthlyReport.incidentComplaintCount",
    privacy: "public",
    note: "상세 내용 제외",
  },
  {
    key: "communityFundAmount",
    label: "상생기금 조성액",
    source: "MonthlyReport.communityFundAmount",
    privacy: "public",
    note: "CONTRIBUTION 합계",
  },
  {
    key: "jobConsultationCount",
    label: "취업연계 상담 건수",
    source: "MonthlyReport.jobConsultationCount",
    privacy: "public",
    note: "연락처와 민감 세부 기록 없이 건수만 제공",
  },
  {
    key: "mouCount",
    label: "MOU 수",
    source: "MonthlyReport.mouCount",
    privacy: "public",
    note: "기관별 문서 링크 없이 월 체결 건수만 제공",
  },
];

export const TRIP_DETAIL_CSV_COLUMNS: CsvColumnContract[] = [
  {
    key: "serviceDate",
    label: "운행일",
    source: "MobilityGroup.serviceDate",
    privacy: "public",
    note: "월 분류 기본 기준",
  },
  {
    key: "timeWindow",
    label: "시간대",
    source: "MobilityGroup.timeWindow",
    privacy: "public",
    note: "운영 설정 timeWindows 기준",
  },
  {
    key: "groupName",
    label: "그룹명",
    source: "MobilityGroup.groupName",
    privacy: "public",
    note: "긴 값은 UI에서 줄바꿈",
  },
  {
    key: "residentNames",
    label: "주민명",
    source: "Resident.name",
    privacy: "restricted",
    note: "VIEWER와 외부 제출용에는 제외 또는 별도 승인",
  },
  {
    key: "residentPhones",
    label: "주민 연락처",
    source: "Resident.phone",
    privacy: "masked",
    note: "기본은 마스킹, 전체값은 권한과 사유 필요",
  },
  {
    key: "destinationSummary",
    label: "목적지 요약",
    source: "MobilityGroup.destinationSummary",
    privacy: "public",
    note: "민감정보 입력 금지",
  },
  {
    key: "linkerName",
    label: "동행링커",
    source: "Linker.name",
    privacy: "restricted",
    note: "내부 운영용",
  },
  {
    key: "taxiActualFare",
    label: "실제 택시요금",
    source: "TaxiReservation.actualFare",
    privacy: "public",
    note: "정산 totalFare와 대조",
  },
  {
    key: "residentPerPersonShare",
    label: "주민 1인 분담액",
    source: "Settlement.residentPerPersonShare",
    privacy: "public",
    note: "정산 반올림 정책 반영",
  },
  {
    key: "anchorSupportAmount",
    label: "앵커 지원금",
    source: "Settlement.anchorSupportAmount",
    privacy: "public",
    note: "상생기금과 구분",
  },
  {
    key: "communityFundSupportAmount",
    label: "상생기금 지원 기록",
    source: "Settlement.communityFundSupportAmount",
    privacy: "public",
    note: "별도 지원 항목",
  },
  {
    key: "returnConfirmedAt",
    label: "귀가 확인",
    source: "MobilityGroupMember.returnConfirmedAt",
    privacy: "public",
    note: "returnConfirmedAt 기준 리포트 선택 시 월 분류에 사용",
  },
];

export const CONTACT_LOG_INPUT_RULES = {
  targetTypes: [
    "Resident",
    "MobilityRequest",
    "MobilityGroup",
    "TaxiReservation",
    "Settlement",
  ],
  requiredFields: ["targetType", "targetId", "contactType", "contactedAt", "summary"],
  privacyRule:
    "연락 요약에는 고유식별정보와 건강 세부정보를 입력하지 않는다.",
  linkRule:
    "ContactLog는 targetType과 targetId로 주요 운영 대상에 연결하며 삭제 대신 감사 가능한 수정 이력을 우선한다.",
} as const;
