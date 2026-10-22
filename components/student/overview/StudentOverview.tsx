import GreetingBar from "./GreetingBar";
import { KpiRow } from "./widgets";

/** Student daily hub: greeting and today's status, then the key numbers. */
export default function StudentOverview() {
  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <GreetingBar />
      <KpiRow />
    </main>
  );
}
