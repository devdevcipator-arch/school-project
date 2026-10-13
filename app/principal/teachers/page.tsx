import type { Metadata } from "next";
import { Suspense } from "react";
import TeachersBoard from "@/components/teachers/TeachersBoard";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Teachers | Principal Portal | ${site.name}`,
};

type Props = PageProps<"/principal/teachers">;

// `?add=1` (from "Add Teacher" on the overview) opens the onboarding form straight away.
async function Board({ searchParams }: Pick<Props, "searchParams">) {
  const { add } = await searchParams;
  return <TeachersBoard startAdding={add === "1"} />;
}

// Faculty & Teachers Management: onboarding, filters and the teacher directory.
export default function TeachersPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<TeachersBoard />}>
      <Board searchParams={searchParams} />
    </Suspense>
  );
}
