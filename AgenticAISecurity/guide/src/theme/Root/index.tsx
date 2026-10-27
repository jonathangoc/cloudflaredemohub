import type { ReactNode } from "react";
import { LabEnvironmentProvider } from "../../context/LabEnvironmentContext";

export default function Root({ children }: { children: ReactNode }) {
  return <LabEnvironmentProvider>{children}</LabEnvironmentProvider>;
}
