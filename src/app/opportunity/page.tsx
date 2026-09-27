import { Suspense } from "react";
import { OpportunityView } from "@/components/OpportunityView";

export default function OpportunityPage() {
  return (
    <Suspense fallback={null}>
      <OpportunityView />
    </Suspense>
  );
}
