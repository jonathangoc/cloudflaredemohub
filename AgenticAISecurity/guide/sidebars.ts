import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  labSidebar: [
    {
      type: "doc",
      id: "explore-seven-hills/index",
      label: "01: Explore Seven Hills",
    },
    {
      type: "category",
      label: "02: Secure MCP",
      link: {
        type: "doc",
        id: "secure-mcp/index",
      },
      items: [
        "secure-mcp/establish-identity",
        "secure-mcp/connect-agent-portal",
        "secure-mcp/enable-gateway-visibility",
        "secure-mcp/protect-mcp-data",
      ],
    },
    {
      type: "category",
      label: "03: Secure AI Gateway",
      link: {
        type: "doc",
        id: "secure-ai-gateway/index",
      },
      items: [
        "secure-ai-gateway/establish-model-baseline",
        "secure-ai-gateway/connect-agent",
        "secure-ai-gateway/dynamic-routing",
        "secure-ai-gateway/cost-controls",
        "secure-ai-gateway/guardrails-dlp",
      ],
    },
    {
      type: "category",
      label: "04: Protect the AI App",
      link: {
        type: "doc",
        id: "protect-ai-app/index",
      },
      items: [
        "protect-ai-app/enable-ai-security-label-endpoints",
        "protect-ai-app/configure-custom-topics",
        "protect-ai-app/review-detections-analytics",
        "protect-ai-app/apply-mitigation-rules",
        "protect-ai-app/retest-compare-custom-extraction",
      ],
    },
    {
      type: "doc",
      id: "wrap-up/index",
      label: "05: Wrap Up",
    },
  ],
};

export default sidebars;
