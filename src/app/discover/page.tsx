import { Suspense } from "react";
import { DiscoverView } from "@/components/DiscoverView";

export default function DiscoverPage() {
  return (
    <Suspense fallback={null}>
      <DiscoverView />
    </Suspense>
  );
}
