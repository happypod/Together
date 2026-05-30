const onlyDigits = /\D/g;

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

export function redactSensitiveValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveValue);
  }

  if (!value || typeof value !== "object") {
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
