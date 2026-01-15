"use client";

import { SessionProvider } from "next-auth/react";
import { InstructionModalProvider } from "@/components/InstructionModalContext";
import InstructionFormModal from "@/components/InstructionFormModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <InstructionModalProvider>
        {children}
        <InstructionFormModal />
      </InstructionModalProvider>
    </SessionProvider>
  );
}

