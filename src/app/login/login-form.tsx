"use client";

import { useActionState } from "react";
import { loginAction, type LoginFormState } from "@/app/login/actions";

const initialState: LoginFormState = {
  message: "",
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="auth-form">
      <label>
        이메일
        <input autoComplete="email" inputMode="email" name="email" placeholder="admin@example.com" />
      </label>
      <label>
        비밀번호
        <input autoComplete="current-password" name="password" type="password" />
      </label>
      {state.message ? (
        <p className="form-message" role="alert">
          {state.message}
        </p>
      ) : null}
      <button className="primary-action" disabled={pending} type="submit">
        {pending ? "확인 중" : "로그인"}
      </button>
    </form>
  );
}
