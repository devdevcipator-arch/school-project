import type { Metadata } from "next";
import { Suspense } from "react";
import AnnouncementsBoard from "@/components/announcements/AnnouncementsBoard";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Announcements | Principal Portal | ${site.name}`,
};

type Props = PageProps<"/principal/announcements">;

// `?compose=1` (from "Post Announcement" on the overview) opens the composer straight away.
async function Board({ searchParams }: Pick<Props, "searchParams">) {
  const { compose } = await searchParams;
  return <AnnouncementsBoard startComposing={compose === "1"} />;
}

// Announcements & Circulars: metrics, emergency banner control, notice feed and composer.
// The board itself is the prerendered shell; the query-aware version streams in.
export default function AnnouncementsPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<AnnouncementsBoard />}>
      <Board searchParams={searchParams} />
    </Suspense>
  );
}
