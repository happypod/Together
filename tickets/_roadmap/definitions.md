# Definitions

## 핵심 용어

| 한국어 | 코드명 | 설명 |
| --- | --- | --- |
| 사용자 | User | 관리자, 운영자, 동행링커, 택시파트너, 조회자 계정 |
| 주민 | Resident | 이동서비스를 신청하거나 이용하는 대상자 |
| 이동 신청 | MobilityRequest | 주민의 생활이동 신청 건 |
| 공동예약 그룹 | MobilityGroup | 같은 날짜, 방향, 시간대의 주민 최대 3명 묶음 |
| 그룹 멤버 | MobilityGroupMember | 공동예약 그룹에 포함된 주민과 신청 |
| 동행링커 | Linker | 주민 이동을 동행하고 귀가확인을 돕는 활동자 |
| 택시연합 예약 | TaxiReservation | 택시연합에 요청하고 확정받는 예약 기록 |
| 운행 기록 | TripLog | 탑승, 도착, 귀가확인 등 운행 진행 기록 |
| 정산 | Settlement | 요금, 주민 분담, 앵커 지원, 영수증 기록 |
| 만족도 조사 | SatisfactionSurvey | 이용 후 만족도와 개선 요청 기록 |
| 사고 및 민원 | IncidentReport | 사고, 민원, 분실, 지연, 귀가 이슈 기록 |
| 상생기금 | CommunityFund | 별도 사회공헌 출연금 또는 지원 기록 |
| 월간 리포트 | MonthlyReport | 월별 운영 성과 집계 |
| 감사 로그 | AuditLog | 주요 생성, 수정, 삭제, 상태 변경, CSV 내보내기 기록 |
| 파일 첨부 | FileAttachment | 영수증 등 제한된 첨부 파일 메타데이터 |
| 모바일 입력 토큰 | MobileFormToken | 로그인 없는 보조 입력 링크의 접근 토큰 |
| 운영 설정 | AppSetting | 기본요금, 정산 반올림, 마을, 시간대 등 운영 설정 |
| 연락 기록 | ContactLog | 주민, 동행링커, 택시연합과의 수동 연락 확인 기록 |

## 이동 목적 enum

```text
HOSPITAL
PHARMACY
MARKET
PUBLIC_OFFICE
FINANCE
POST_OFFICE
OTHER
```

화면 표시:

- `HOSPITAL`: 병원
- `PHARMACY`: 약국
- `MARKET`: 장보기
- `PUBLIC_OFFICE`: 공공기관
- `FINANCE`: 금융기관
- `POST_OFFICE`: 우체국
- `OTHER`: 기타 생활이동

## 기본 상태 enum

```text
REQUESTED
RECRUITING
GROUP_READY
LINKER_RECRUITING
LINKER_ASSIGNED
TAXI_REQUESTED
TAXI_CONFIRMED
IN_PROGRESS
RETURN_CONFIRMED
SETTLED
REPORTED
```

화면 표시:

- `REQUESTED`: 신청접수
- `RECRUITING`: 모집중
- `GROUP_READY`: 그룹확정
- `LINKER_RECRUITING`: 링커모집
- `LINKER_ASSIGNED`: 링커확정
- `TAXI_REQUESTED`: 택시요청
- `TAXI_CONFIRMED`: 택시확정
- `IN_PROGRESS`: 운행중
- `RETURN_CONFIRMED`: 귀가확인
- `SETTLED`: 정산완료
- `REPORTED`: 보고완료

## 취소 상태 enum

```text
CANCELED_BY_RESIDENT
CANCELED_BY_OPERATOR
CANCELED_BY_TAXI
CANCELED_BY_WEATHER
CANCELED_BY_OTHER
```

모든 취소 상태는 사유 입력이 필수다.

## 예외 상태 enum

```text
INCIDENT_REPORTED
COMPLAINT_REPORTED
NO_SHOW
PARTIAL_COMPLETED
```

예외 상태는 관리자 또는 운영자 권한에서만 변경할 수 있으며 AuditLog를 남긴다.

## 동행링커 상태 enum

```text
CANDIDATE
IN_TRAINING
TRAINING_COMPLETED
FIELD_PRACTICE_COMPLETED
AVAILABLE
ACTIVE
PAUSED
ENDED
```

화면 표시:

- `CANDIDATE`: 후보
- `IN_TRAINING`: 교육중
- `TRAINING_COMPLETED`: 교육이수
- `FIELD_PRACTICE_COMPLETED`: 실습이수
- `AVAILABLE`: 활동가능
- `ACTIVE`: 활동중
- `PAUSED`: 일시중지
- `ENDED`: 활동종료

## 역할 enum

```text
SUPER_ADMIN
ANCHOR_ADMIN
COUNCIL_OPERATOR
LINKER
TAXI_PARTNER
VIEWER
```

## 정산 모드 enum

```text
PILOT
SELF_RELIANCE
COMMUNITY_SUPPORT
CUSTOM
```

화면 표시:

- `PILOT`: 시범기
- `SELF_RELIANCE`: 자립전환기
- `COMMUNITY_SUPPORT`: 취약계층 또는 상생기금 지원
- `CUSTOM`: 직접 입력

## 정산 반올림 정책 enum

```text
ROUND
FLOOR
CEIL
MANUAL
```

화면 표시:

- `ROUND`: 반올림
- `FLOOR`: 절사
- `CEIL`: 올림
- `MANUAL`: 직접 조정

## 감사로그 action enum 권장값

```text
CREATE
UPDATE
DELETE
SOFT_DELETE
STATUS_CHANGE
ASSIGN
UNASSIGN
EXPORT_CSV
UPLOAD_FILE
LOGIN
LOGOUT
TOKEN_CREATE
TOKEN_SUBMIT
TOKEN_REVOKE
SETTLEMENT_LOCK
SETTLEMENT_UNLOCK
```

## 모바일 입력 토큰 scope enum 권장값

```text
REQUEST_INTAKE
TRIP_CHECK
RETURN_CONFIRM
SURVEY_SUBMIT
TAXI_CONFIRM
```

토큰은 대상 엔티티와 허용 scope를 함께 가져야 한다. scope 밖의 필드 수정은 서버에서 거부한다.

## 연락 기록 contactType enum 권장값

```text
RESIDENT_CALL
GUARDIAN_CALL
LINKER_CALL
TAXI_PARTNER_CALL
ON_SITE
SMS_MANUAL
OTHER
```

MVP에서 문자 자동 발송은 제외하지만, 수동 연락 사실은 기록할 수 있다.

## 개인정보 최소수집 기준

- 필수 수집: 이름, 마을명, 연락처, 이동 희망일, 시간대, 목적, 출발지, 목적지
- 선택 수집: 보호자 연락처, 운영 메모, 특이사항
- 금지 수집: 주민등록번호, 세부 건강정보, 진단명, 처치 또는 상담 내용, 실시간 좌표
- 동의 확인: 개인정보 동의, 제3자 제공 동의, 민감정보 미수집 확인
- 목록 화면: 연락처 마스킹 적용
- CSV 내보내기: 권한 제한 및 AuditLog 필수

## 최소 필드 기준

### Resident

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid | PK |
| name | string | 주민 또는 신청자명 |
| villageName | string | 마을명 |
| phone | string | 연락처, 목록에서는 마스킹 |
| guardianPhone | string? | 보호자 연락처, 선택 입력 |
| memo | text? | 운영 메모, 민감정보 입력 금지 |
| createdAt | datetime | 생성일 |
| updatedAt | datetime | 수정일 |
| deletedAt | datetime? | soft delete 또는 비활성화 시각 |

### MobilityRequest

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid | PK |
| residentId | uuid | Resident FK |
| desiredDate | date | 이동 희망일 |
| desiredTimeWindow | string | 희망 시간대 |
| purpose | enum | 이동 목적 |
| origin | string | 출발지 |
| destination | string | 목적지 |
| needsCompanion | boolean | 동행 필요 여부 |
| notes | text? | 특이사항, 민감정보 입력 금지 |
| status | enum | 기본 상태 또는 취소/예외 상태 |
| privacyConsent | boolean | 개인정보 동의 |
| thirdPartyConsent | boolean | 제3자 제공 동의 |
| sensitiveInfoNotCollected | boolean | 민감정보 미수집 확인 |
| createdByUserId | uuid | 등록 사용자 |
| createdAt | datetime | 생성일 |
| updatedAt | datetime | 수정일 |
| deletedAt | datetime? | soft delete 또는 비활성화 시각 |

### MobilityGroup

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid | PK |
| groupName | string | 자동 생성 또는 운영자 수정 |
| serviceDate | date | 이동일 |
| timeWindow | string | 시간대 |
| destinationSummary | string | 목적지 요약 |
| returnEta | datetime? | 귀가 예정시간 |
| linkerId | uuid? | Linker FK |
| status | enum | 그룹 진행 상태 |
| exceptionReason | text? | 예외 또는 취소 사유 |
| notes | text? | 운영 메모 |
| createdByUserId | uuid | 생성 사용자 |
| createdAt | datetime | 생성일 |
| updatedAt | datetime | 수정일 |
| deletedAt | datetime? | soft delete 또는 비활성화 시각 |

### MobilityGroupMember

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid | PK |
| groupId | uuid | MobilityGroup FK |
| requestId | uuid | MobilityRequest FK |
| residentId | uuid | Resident FK |
| pickupOrder | int | 픽업 순서, 그룹 내 중복 금지 |
| pickupEta | datetime? | 픽업 예정시간 |
| pickupPlace | string | 픽업 장소 |
| returnConfirmedAt | datetime? | 주민별 귀가 확인 시각 |
| memberStatus | enum | ACTIVE, CANCELED, NO_SHOW |

### Linker

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid | PK |
| name | string | 동행링커명 |
| villageName | string | 마을명 |
| phone | string | 연락처 |
| availableDays | string[] | 가능 요일 |
| availableTimeWindows | string[] | 가능 시간대 |
| trainingCompleted | boolean | 교육 이수 여부 |
| fieldPracticeCompleted | boolean | 현장실습 이수 여부 |
| privacyPledgeSigned | boolean | 개인정보보호 서약 여부 |
| insuranceRegistered | boolean | 보험 등록 여부 |
| status | enum | 동행링커 상태 |
| activityCount | int | 활동 횟수 |
| incidentComplaintHistory | text? | 민원/사고 이력 요약 |
| wantsJobConnection | boolean | 취업연계 희망 여부 |
| desiredJobField | string? | 희망 분야 |
| createdAt | datetime | 생성일 |
| updatedAt | datetime | 수정일 |
| deletedAt | datetime? | soft delete 또는 비활성화 시각 |

### TaxiReservation

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid | PK |
| groupId | uuid | MobilityGroup FK |
| requestedAt | datetime | 예약 요청시간 |
| partnerManagerName | string? | 택시연합 담당자 |
| reservationConfirmed | boolean | 예약 확정 여부 |
| confirmedAt | datetime? | 확정 시각 |
| vehicleNumber | string? | 차량번호 |
| driverPhone | string? | 기사 연락처, 상세 권한 제한 |
| expectedFare | int? | 예상요금 |
| actualFare | int? | 실제요금 |
| receiptAttached | boolean | 영수증 첨부 또는 링크 여부 |
| receiptUrl | string? | 영수증 링크 |
| notes | text? | 비고 |

### TripLog

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid | PK |
| groupId | uuid | MobilityGroup FK |
| status | enum | 운행상태 |
| linkerBoardedAt | datetime? | 동행링커 탑승 확인 |
| resident1BoardedAt | datetime? | 주민 1 탑승 확인 |
| resident2BoardedAt | datetime? | 주민 2 탑승 확인 |
| resident3BoardedAt | datetime? | 주민 3 탑승 확인 |
| arrivedAtDestination | datetime? | 목적지 도착 |
| serviceTaskConfirmed | boolean | 생활업무 수행 확인 |
| returnStartedAt | datetime? | 귀가 출발 |
| allReturnsConfirmedAt | datetime? | 전체 귀가 확인 |
| notes | text? | 특이사항 |
| createdByUserId | uuid | 입력 사용자 |
| createdAt | datetime | 생성일 |

### Settlement

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid | PK |
| groupId | uuid | MobilityGroup FK |
| settlementMode | enum | 정산 모드 |
| totalFare | int | 총 택시요금 |
| residentCount | int | 주민 수 |
| residentTotalShare | int | 주민 총 분담금 |
| residentPerPersonShare | int | 주민 1인 분담액 |
| anchorSupportAmount | int | 앵커 지원금 |
| linkerActivityFee | int? | 동행링커 활동비 |
| communityFundSupportAmount | int? | 상생기금 지원 기록 |
| receiptUrl | string? | 영수증 링크 |
| isSettled | boolean | 정산 완료 여부 |
| settledAt | datetime? | 정산 완료일 |
| lockedAt | datetime? | 정산 잠금 시각 |
| updatedReason | text? | 정산 완료 후 수정 사유 |

### SatisfactionSurvey

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid | PK |
| groupId | uuid | MobilityGroup FK |
| residentId | uuid? | Resident FK |
| userSatisfaction | int | 이용자 만족도 |
| linkerSatisfaction | int | 동행링커 만족도 |
| taxiSatisfaction | int | 택시 이용 만족도 |
| costBurdenFeeling | int | 비용 부담 체감 |
| reuseIntent | int | 재이용 의향 |
| inconvenience | text? | 불편사항 |
| improvementRequest | text? | 개선 요청 |
| hasIncident | boolean | 사고 여부 |
| hasComplaint | boolean | 민원 여부 |
| issueTypes | string[] | 동승, 분실, 미귀가, 지연 등 |
| createdAt | datetime | 생성일 |

### IncidentReport

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid | PK |
| groupId | uuid | MobilityGroup FK |
| incidentType | enum | INCIDENT, COMPLAINT, LOST_ITEM, DELAY, RETURN_ISSUE, OTHER |
| occurredAt | datetime? | 발생 시각 |
| description | text | 내용, 민감정보 입력 금지 |
| actionTaken | text? | 조치 내용 |
| reportedByUserId | uuid | 신고/기록 사용자 |
| createdAt | datetime | 생성일 |

### CommunityFund

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid | PK |
| groupId | uuid? | MobilityGroup FK |
| month | string | YYYY-MM |
| amount | int | 조성 또는 지원 금액 |
| fundType | enum | CONTRIBUTION, SUPPORT_RECORD |
| source | string | 출연 또는 지원 주체 |
| note | text? | 비고 |
| createdAt | datetime | 생성일 |

### MonthlyReport

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid | PK |
| month | string | YYYY-MM |
| tripCount | int | 월 운행건수 |
| monthlyResidentCount | int | 월 이용 주민 수 |
| cumulativeResidentCount | int | 누적 이용 주민 수 |
| linkerActivityCount | int | 월 동행링커 활동건수 |
| activeLinkerCount | int | 활동 동행링커 수 |
| averageFare | int | 평균 택시요금 |
| totalAnchorSupport | int | 총 이동지원비 |
| averageResidentShare | int | 주민 1인 평균 분담액 |
| estimatedSaving | int | 이동 대비 절감액 추정 |
| satisfactionAverage | float | 만족도 평균 |
| incidentComplaintCount | int | 사고/민원 건수 |
| communityFundAmount | int | 상생기금 조성액 |
| jobConsultationCount | int | 취업연계 상담건수 |
| mouCount | int | MOU 수 |
| generatedAt | datetime | 생성 시각 |

### AuditLog

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid | PK |
| userId | uuid | 사용자 ID |
| action | string | 수행 작업 |
| targetType | string | 대상 데이터 종류 |
| targetId | uuid | 대상 데이터 ID |
| beforeValue | json? | 변경 전 값, 개인정보 최소화 |
| afterValue | json? | 변경 후 값, 개인정보 최소화 |
| performedAt | datetime | 작업 시각 |
| accessContext | string? | IP 또는 접근 환경 |
| note | text? | 비고 또는 사유 |

### User

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid | PK |
| name | string | 사용자 이름 |
| email | string? | 로그인 식별자, 구현 방식에 따라 optional |
| phone | string? | 연락처 |
| role | enum | MVP는 단일 역할로 시작 가능 |
| isActive | boolean | 비활성 사용자 접근 차단 |
| lastLoginAt | datetime? | 최근 로그인 |
| createdAt | datetime | 생성일 |
| updatedAt | datetime | 수정일 |

### FileAttachment

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid | PK |
| targetType | string | 연결 대상 모델 |
| targetId | uuid | 연결 대상 ID |
| fileType | enum | RECEIPT, CONSENT, OTHER |
| fileName | string | 원본 파일명 또는 표시명 |
| mimeType | string | 허용 형식 제한 |
| sizeBytes | int | 크기 제한 |
| url | string | 저장 위치 또는 외부 링크 |
| uploadedByUserId | uuid | 업로드 사용자 |
| createdAt | datetime | 생성일 |

### MobileFormToken

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid | PK |
| tokenHash | string | 원문 토큰 저장 금지 |
| scope | enum | 입력 가능 범위 |
| targetType | string | 연결 대상 모델 |
| targetId | uuid | 연결 대상 ID |
| expiresAt | datetime | 만료시간 |
| maxUseCount | int | 기본 1 또는 운영 설정 |
| usedCount | int | 사용 횟수 |
| revokedAt | datetime? | 폐기 시각 |
| createdByUserId | uuid | 발급 사용자 |
| createdAt | datetime | 생성일 |

### AppSetting

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| key | string | PK |
| value | json | 설정값 |
| description | string? | 설명 |
| updatedByUserId | uuid? | 수정 사용자 |
| updatedAt | datetime | 수정일 |

권장 초기 설정:

- `defaultFare`: 72000
- `defaultResidentCount`: 3
- `maxGroupResidents`: 3
- `fareRoundingPolicy`: ROUND 또는 FLOOR 중 확정
- `mobileTokenTtlHours`: 24
- `reportDateBasis`: serviceDate 또는 returnConfirmedAt 중 확정
- `villages`: 운영 마을 목록
- `timeWindows`: 운영 시간대 목록

### ContactLog

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid | PK |
| targetType | string | Resident, MobilityGroup, TaxiReservation 등 |
| targetId | uuid | 연결 대상 ID |
| contactType | enum | 연락 유형 |
| contactedAt | datetime | 연락 시각 |
| summary | text | 민감정보 없이 요약 |
| createdByUserId | uuid | 기록 사용자 |
| createdAt | datetime | 생성일 |

## 핵심 데이터 관계

```text
User 1:N AuditLog
User 1:N MobileFormToken
Resident 1:N MobilityRequest
MobilityRequest N:M MobilityGroup through MobilityGroupMember
MobilityGroup 1:1 TaxiReservation
MobilityGroup 1:N TripLog
MobilityGroup 1:1 Settlement
MobilityGroup 1:N SatisfactionSurvey
MobilityGroup 1:N IncidentReport
MobilityGroup 1:N CommunityFund
FileAttachment N:1 target by targetType and targetId
ContactLog N:1 target by targetType and targetId
MonthlyReport stores or caches monthly aggregates
AuditLog records major writes and state changes
```

## 권한 적용 원칙

- 권한 검사는 모든 쓰기 action에서 서버가 수행한다.
- UI에서 버튼을 숨기더라도 서버 권한 검증을 생략하지 않는다.
- `LINKER`는 본인 정보와 배정된 그룹의 제한 필드만 입력한다.
- `TAXI_PARTNER`는 예약 확정과 요금, 영수증 관련 제한 필드만 입력한다.
- `VIEWER`는 내보내기 권한이 별도로 허용된 경우에만 CSV를 다운로드할 수 있다.
- `SUPER_ADMIN`만 사용자 비활성화, 권한 변경, 정산 잠금 해제를 수행할 수 있다.
