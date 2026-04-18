"use client"

import * as React from "react"
import { Collapse } from "antd"
import { useTranslation } from "@/hooks/useTranslation"

/** Key con của `common.formSections` trong locale (vd: `basic` → `common.formSections.basic`). */
export type FormSectionTitleKey =
  | "basic"
  | "contact"
  | "assignment"
  | "schedule"
  | "financial"
  | "identity"
  | "operational"
  | "single"
  | "relations"
  | "status"

export interface FormAccordionSectionSpec {
  /** Giá trị panel (unique). */
  value: string
  /** Khóa tiêu đề dưới `common.formSections`. */
  titleKey: FormSectionTitleKey
  children: React.ReactNode
}

type FormAccordionSectionsProps = {
  sections: FormAccordionSectionSpec[]
  /** Section mở mặc định; mặc định là section đầu tiên. */
  defaultOpen?: string
  className?: string
}

/**
 * Nhóm field form theo section thu/mở (Ant Design Collapse).
 * Dùng bên trong một `<Form>` Ant Design duy nhất.
 */
export function FormAccordionSections({
  sections,
  defaultOpen,
  className,
}: FormAccordionSectionsProps) {
  const { t } = useTranslation()
  const defaultActiveKey = defaultOpen ?? sections[0]?.value ?? ""

  if (sections.length === 0) {
    return null
  }

  return (
    <Collapse
      bordered={false}
      defaultActiveKey={defaultActiveKey ? [defaultActiveKey] : undefined}
      className={className ?? "form-accordion-sections flex w-full flex-col gap-2 bg-transparent"}
      expandIconPosition="end"
      items={sections.map((section) => ({
        key: section.value,
        label: t(`common.formSections.${section.titleKey}`),
        className: "rounded-lg border border-border/70 bg-muted/20",
        forceRender: true,
        children: <div className="flex flex-col gap-3">{section.children}</div>,
      }))}
    />
  )
}
