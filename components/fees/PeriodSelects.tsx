"use client";

import { Select } from "@/components/dashboard/controls";
import { academicMonthNames, academicMonths, monthLabel } from "@/lib/fees";
import { AS_OF } from "@/lib/students";

/** Year and month dropdowns for payment records; months follow the chosen academic year. */
export default function PeriodSelects({
  years,
  year,
  month,
  onYear,
  onMonth,
}: {
  years: string[];
  year: string;
  month: string;
  onYear: (y: string) => void;
  onMonth: (m: string) => void;
}) {
  const months =
    year === "all"
      ? academicMonthNames.map((m) => ({ value: m.mm, label: `${m.name} (every year)` }))
      : academicMonths(Number(year.slice(0, 4)))
          .filter((m) => m <= AS_OF.slice(0, 7))
          .map((m) => ({ value: m, label: monthLabel(m) }));
  return (
    <>
      <Select
        label="Academic year"
        value={year}
        onChange={(y) => {
          onYear(y);
          // A month from another year would match nothing, so start the new year on all months.
          onMonth("all");
        }}
      >
        <option value="all">All academic years</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
      <Select label="Month" value={month} onChange={onMonth}>
        <option value="all">All months</option>
        {months.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </Select>
    </>
  );
}
