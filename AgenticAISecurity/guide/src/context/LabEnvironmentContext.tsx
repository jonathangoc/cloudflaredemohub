import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "seven-hills-lab-environment";

// Literal placeholders used in guide code blocks and inline code. The MDX Code
// component swaps them for the attendee's saved values.
export const LAB_DOMAIN_PLACEHOLDER = "<your-lab-domain>";
export const MCP_HOST_PLACEHOLDER = "<your-mcp-host>";

export type LabEnvironment = {
  // Zone apex that serves the Seven Hills app, e.g. "sevenhills-lab.com".
  labDomain: string;
  // Hostname of the Shared Operations MCP Worker, e.g.
  // "seven-hills-operations-mcp.example.workers.dev".
  mcpHost: string;
};

const EMPTY: LabEnvironment = { labDomain: "", mcpHost: "" };

type LabEnvironmentContextValue = {
  environment: LabEnvironment;
  setEnvironment: (environment: LabEnvironment) => void;
};

const LabEnvironmentContext = createContext<LabEnvironmentContextValue | undefined>(undefined);

function readStored(): LabEnvironment {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<LabEnvironment>;
    return {
      labDomain: typeof parsed.labDomain === "string" ? parsed.labDomain : "",
      mcpHost: typeof parsed.mcpHost === "string" ? parsed.mcpHost : "",
    };
  } catch {
    return EMPTY;
  }
}

export function LabEnvironmentProvider({ children }: { children: ReactNode }) {
  const [environment, setEnvironmentState] = useState<LabEnvironment>(EMPTY);

  useEffect(() => {
    setEnvironmentState(readStored());
  }, []);

  function setEnvironment(next: LabEnvironment) {
    setEnvironmentState(next);
    if (next.labDomain || next.mcpHost) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  return (
    <LabEnvironmentContext.Provider value={{ environment, setEnvironment }}>
      {children}
    </LabEnvironmentContext.Provider>
  );
}

export function useLabEnvironment() {
  const context = useContext(LabEnvironmentContext);
  if (!context) {
    throw new Error("useLabEnvironment must be used within LabEnvironmentProvider");
  }
  return context;
}

export function applyLabEnvironment(text: string, environment: LabEnvironment): string {
  let result = text;
  if (environment.labDomain) result = result.replaceAll(LAB_DOMAIN_PLACEHOLDER, environment.labDomain);
  if (environment.mcpHost) result = result.replaceAll(MCP_HOST_PLACEHOLDER, environment.mcpHost);
  return result;
}
