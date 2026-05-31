const onlyDigits = /\D/g;

export const PRIVACY_INPUT_GUIDANCE =
  "주민등록번호, 여권번호, 건강 세부정보는 입력하지 않습니다.";

const forbiddenSensitiveInfoPattern = new RegExp(
  [
    "\\b\\d{6}[-\\s]?[1-4]\\d{6}\\b",
    "주민\\s*등록\\s*번호",
    "주민\\s*번호",
    "외국인\\s*등록\\s*번호",
    "여권\\s*번호",
    "운전\\s*면허\\s*번호",
    "건강\\s*보험\\s*번호",
    "진단\\s*명",
    "병\\s*명",
    "의료\\s*기록",
    "검사\\s*결과",
    "처치",
    "상담\\s*내용",
    "혈압",
    "혈당",
    "복용\\s*약",
    "처방",
    "수술",
    "질환",
    "장애\\s*등급",
    "요양\\s*등급",
  ].join("|"),
  "i",
);

export function maskPhone(phone?: string | null) {
  if (!phone) {
    return "";
  }

  const digits = phone.replace(onlyDigits, "");
  if (digits.length < 7) {
    return phone.replace(/\d/g, "*");
  }

  const head = digits.slice(0, 3);
  const tail = digits.slice(-4);
  return `${head}-****-${tail}`;
}

export function hasForbiddenSensitiveInfo(value?: string | null) {
  return forbiddenSensitiveInfoPattern.test(String(value ?? ""));
}

export function assertNoForbiddenSensitiveInfo(
  fields: Record<string, string | null | undefined>,
) {
  for (const [label, value] of Object.entries(fields)) {
    if (hasForbiddenSensitiveInfo(value)) {
      throw new Error(`${label}에는 ${PRIVACY_INPUT_GUIDANCE}`);
    }
  }
}

export function redactSensitiveValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveValue);
  }

  if (!value || typeof value !== "object") {
    if (typeof value === "string" && hasForbiddenSensitiveInfo(value)) {
      return "[SENSITIVE_REDACTED]";
    }
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes("phone")) {
        return [key, maskPhone(String(entryValue ?? ""))];
      }
      if (lowerKey.includes("password") || lowerKey.includes("tokenhash")) {
        return [key, "[REDACTED]"];
      }
      if (lowerKey.includes("memo") || lowerKey.includes("notes")) {
        return [key, entryValue ? "[SUMMARY_REDACTED]" : entryValue];
      }
      return [key, redactSensitiveValue(entryValue)];
    }),
  );
}
