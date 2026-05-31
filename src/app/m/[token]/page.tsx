import { MobileTokenForm } from "@/app/m/[token]/mobile-token-form";
import { getMobileTokenView } from "@/server/mobile-forms/token-service";
import { DEFAULT_OPERATING_SETTINGS } from "@/server/settings/defaults";
import { getOperatingSettings } from "@/server/settings/settings-service";

export const dynamic = "force-dynamic";

type MobileTokenPageProps = {
  params: Promise<{
    token: string;
  }>;
};

const reasonText = {
  not_found: {
    title: "링크를 확인할 수 없습니다.",
    body: "주소가 잘못되었거나 운영자가 링크를 다시 발급해야 합니다.",
  },
  expired: {
    title: "만료된 링크입니다.",
    body: "입력 시간이 지나 저장할 수 없습니다. 운영자에게 새 링크를 요청해 주세요.",
  },
  revoked: {
    title: "사용이 중지된 링크입니다.",
    body: "운영자가 링크를 중지했습니다. 새 링크를 받아 다시 진행해 주세요.",
  },
  used_up: {
    title: "이미 사용한 링크입니다.",
    body: "중복 입력을 막기 위해 사용한 링크는 다시 저장할 수 없습니다.",
  },
} as const;

const scopeLabels = {
  REQUEST_INTAKE: "신청 입력",
  TRIP_CHECK: "운행 체크",
  RETURN_CONFIRM: "귀가 확인",
  SURVEY_SUBMIT: "만족도 입력",
  TAXI_CONFIRM: "택시 예약 확정",
} as const;

export default async function MobileTokenPage({ params }: MobileTokenPageProps) {
  const { token } = await params;
  const [view, settings] = await Promise.all([
    getMobileTokenView(token),
    getOperatingSettings().catch(() => DEFAULT_OPERATING_SETTINGS),
  ]);

  if (!view.ok) {
    const reason = reasonText[view.reason];
    return (
      <main className="mobile-token-page">
        <section className="mobile-token-panel">
          <p className="eyebrow">모바일 입력</p>
          <h1>{reason.title}</h1>
          <p className="lead">{reason.body}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mobile-token-page">
      <section className="mobile-token-panel" aria-labelledby="mobile-token-title">
        <p className="eyebrow">모바일 입력</p>
        <h1 id="mobile-token-title">내용 확인</h1>
        <p className="lead">
          이 화면에서 입력한 내용만 저장됩니다. 관리자 화면 전체 권한은 제공하지 않습니다.
          <br />
          주민등록번호와 건강 세부정보는 적지 않습니다.
        </p>
        <dl className="token-summary">
          <div>
            <dt>입력 범위</dt>
            <dd>{scopeLabels[view.scope]}</dd>
          </div>
          <div>
            <dt>남은 횟수</dt>
            <dd>{view.remainingUses}회</dd>
          </div>
          <div>
            <dt>만료 시간</dt>
            <dd>{view.expiresAt.toLocaleString("ko-KR")}</dd>
          </div>
        </dl>
        <MobileTokenForm
          allowedFields={view.allowedFields}
          scope={view.scope}
          settings={settings}
          token={token}
        />
      </section>
    </main>
  );
}
