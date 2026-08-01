"use client";

import { useDailyGanttData } from "./useDailyGanttData";
import { DailyGanttTimeline } from "./DailyGanttTimeline";
import type { DailyGanttFilters } from "./DailyGanttTypes";

interface Props {
  filters: DailyGanttFilters;
}

export function DailyGanttModule({ filters }: Props) {
  const { items, loading, error } = useDailyGanttData(filters);
  return <DailyGanttTimeline items={items} loading={loading} error={error} />;
}
