"use client";

import type { ReactNode } from "react";
import { Nav } from "./Nav";
import { PresenterProvider } from "./Presenter";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <PresenterProvider>
      <Nav />
      <main className="mx-auto w-full max-w-[1400px] px-4 pb-32 sm:px-6">{children}</main>
      <footer className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 border-t border-line-soft px-4 py-6 text-xs text-faint sm:px-6">
        <span>KanDelta does not predict virality. It detects observable mismatches between content supply and audience response.</span>
        <span>
          Powered by <span className="text-muted">Oriane</span> · Built on <span className="text-muted">Replit</span> · <span className="text-muted">Team Kanban</span>
        </span>
      </footer>
    </PresenterProvider>
  );
}
