"use client"

import * as React from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
  /** Giá trị `AccordionItem` (unique). */
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
 * Nhóm field form theo section thu/mở (Radix Accordion + animation).
 * Dùng bên trong một `<Form>` Ant Design duy nhất.
 */
export function FormAccordionSections({
  sections,
  defaultOpen,
  className,
}: FormAccordionSectionsProps) {
  const { t } = useTranslation()
  const defaultValue = defaultOpen ?? sections[0]?.value ?? ""

  if (sections.length === 0) {
    return null
  }

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultValue}
      className={className ?? "flex w-full flex-col gap-2"}
    >
      {sections.map((section) => (
        <AccordionItem
          key={section.value}
          value={section.value}
          className="rounded-lg border border-border/70 bg-muted/20 px-1 data-[state=open]:bg-muted/35"
        >
          <AccordionTrigger className="px-3 py-2.5 text-sm font-medium hover:no-underline">
            {t(`common.formSections.${section.titleKey}`)}
          </AccordionTrigger>
          <AccordionContent className="px-3 pt-0 pb-3">
            <div className="flex flex-col gap-3">{section.children}</div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
