import { useEffect, useState, type FormEvent } from "react";
import { useLabEnvironment } from "../../context/LabEnvironmentContext";

const HOSTNAME_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

// Accept pasted URLs such as "https://host/mcp" and keep only the hostname.
function normalizeHost(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  try {
    return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`).hostname;
  } catch {
    return trimmed;
  }
}

export default function LabEnvironmentInput() {
  const { environment, setEnvironment } = useLabEnvironment();
  const [labDomain, setLabDomain] = useState(environment.labDomain);
  const [mcpHost, setMcpHost] = useState(environment.mcpHost);
  const [error, setError] = useState("");

  useEffect(() => {
    setLabDomain(environment.labDomain);
    setMcpHost(environment.mcpHost);
  }, [environment]);

  const saved = Boolean(environment.labDomain && environment.mcpHost);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextDomain = normalizeHost(labDomain);
    const nextMcpHost = normalizeHost(mcpHost);

    if (!HOSTNAME_PATTERN.test(nextDomain)) {
      setError("Enter the lab domain as a hostname, for example sevenhills-lab.com.");
      return;
    }
    if (!HOSTNAME_PATTERN.test(nextMcpHost)) {
      setError("Enter the MCP server host, for example seven-hills-operations-mcp.example.workers.dev.");
      return;
    }

    setError("");
    setLabDomain(nextDomain);
    setMcpHost(nextMcpHost);
    setEnvironment({ labDomain: nextDomain, mcpHost: nextMcpHost });
  }

  function clear() {
    setError("");
    setEnvironment({ labDomain: "", mcpHost: "" });
  }

  return (
    <section className="lab-slug-card" aria-labelledby="lab-env-heading">
      <h2 id="lab-env-heading">Set your lab environment</h2>
      <p>
        Enter the two values your lab host gave you. The guide uses them in
        commands and URLs on every page in this browser.
      </p>
      <form onSubmit={save} noValidate>
        <label htmlFor="lab-domain-input">Lab domain</label>
        <div className="lab-slug-controls">
          <input
            id="lab-domain-input"
            name="labDomain"
            type="text"
            value={labDomain}
            onChange={(event) => setLabDomain(event.target.value)}
            placeholder="sevenhills-lab.com"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(error)}
          />
        </div>
        <label htmlFor="mcp-host-input">MCP server host</label>
        <div className="lab-slug-controls">
          <input
            id="mcp-host-input"
            name="mcpHost"
            type="text"
            value={mcpHost}
            onChange={(event) => setMcpHost(event.target.value)}
            placeholder="seven-hills-operations-mcp.example.workers.dev"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(error)}
          />
          <button className="button button--primary" type="submit">
            {saved ? "Update" : "Save"}
          </button>
          {saved && (
            <button className="button button--secondary" type="button" onClick={clear}>
              Clear
            </button>
          )}
        </div>
        {error ? (
          <p className="lab-slug-error" role="alert">
            {error}
          </p>
        ) : (
          <p className="lab-slug-status">
            {saved
              ? `Saved for this browser: app https://${environment.labDomain}, MCP server https://${environment.mcpHost}/mcp`
              : "Both values are required."}
          </p>
        )}
      </form>
    </section>
  );
}
