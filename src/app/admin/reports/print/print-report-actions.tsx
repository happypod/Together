"use client";

import { FaIcon } from "@/components/ui/fa-icon";

export function PrintReportActions() {
  return (
    <button className="primary-action print-action-button" onClick={() => window.print()} type="button">
      <FaIcon name="print" />
      인쇄
    </button>
  );
}
