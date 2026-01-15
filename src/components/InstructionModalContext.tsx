"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface InstructionModalDefaults {
  phase?: number;
  planet?: string;
  missionType?: "combat" | "special" | "fleet";
  missionNumber?: number;
}

interface InstructionModalContextType {
  isOpen: boolean;
  defaultValues: InstructionModalDefaults | null;
  onSaveCallback: (() => void) | null;
  openModal: (defaults?: InstructionModalDefaults, onSave?: () => void) => void;
  closeModal: () => void;
}

const InstructionModalContext = createContext<InstructionModalContextType | null>(null);

export function InstructionModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultValues, setDefaultValues] = useState<InstructionModalDefaults | null>(null);
  const [onSaveCallback, setOnSaveCallback] = useState<(() => void) | null>(null);

  const openModal = useCallback((defaults?: InstructionModalDefaults, onSave?: () => void) => {
    setDefaultValues(defaults || null);
    setOnSaveCallback(() => onSave || null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setDefaultValues(null);
    setOnSaveCallback(null);
  }, []);

  return (
    <InstructionModalContext.Provider value={{ isOpen, defaultValues, onSaveCallback, openModal, closeModal }}>
      {children}
    </InstructionModalContext.Provider>
  );
}

export function useInstructionModal() {
  const context = useContext(InstructionModalContext);
  if (!context) {
    throw new Error("useInstructionModal must be used within an InstructionModalProvider");
  }
  return context;
}
