import GreetingBar from "./GreetingBar";
import { DueSoonCard, KpiRow, ScheduleCard, UrgentNotices } from "./widgets";

/** Student daily hub: notices first, then today's numbers, schedule and deadlines. */
export default function StudentOverview() {
  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <GreetingBar />
      <UrgentNotices />
      <KpiRow />
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="grid xl:col-span-2">
          <ScheduleCard />
        </div>
        <DueSoonCard />
      </div>
    </main>
  );
}
