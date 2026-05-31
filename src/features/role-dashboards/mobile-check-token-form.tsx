"use client";

import { type FormEvent, useState } from "react";
import { FaIcon } from "@/components/ui/fa-icon";

export function MobileCheckTokenForm() {
  const [token, setToken] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = token.trim();
    if (!normalized) {
      return;
    }
    window.location.assign(`/m/${encodeURIComponent(normalized)}`);
  }

  return (
    <form className="pub-form role-token-form" onSubmit={submit}>
      <p className="pub-form-privacy-note" role="note">
        운영자가 보낸 모바일 체크 링크 전체 또는 마지막 토큰을 입력하면 동행 체크 화면으로 이동합니다.
      </p>
      <label className="pub-label">
        동행 체크 링크 또는 토큰
        <input
          className="pub-input"
          maxLength={240}
          onChange={(event) => {
            const value = event.target.value.trim();
            const match = value.match(/\/m\/([^/?#]+)/);
            setToken(match?.[1] ?? value);
          }}
          placeholder="예: 운영자가 보낸 /m/토큰"
          value={token}
        />
      </label>
      <button className="pub-submit-btn" disabled={!token.trim()} type="submit">
        <FaIcon name="check" />
        동행 체크 진행
      </button>
    </form>
  );
}
