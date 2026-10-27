import React, { type ComponentProps, type ReactNode } from "react";
import CodeBlock from "@theme/CodeBlock";
import CodeInline from "@theme/CodeInline";
import type { Props } from "@theme/MDXComponents/Code";
import { applyLabEnvironment, useLabEnvironment } from "../../../context/LabEnvironmentContext";

export default function MDXCode(props: Props): ReactNode {
  const { environment } = useLabEnvironment();
  const children = React.Children.map(props.children, (child) =>
    typeof child === "string" ? applyLabEnvironment(child, environment) : child,
  );

  const resolvedProps = { ...props, children };
  const isInline =
    typeof children !== "undefined" &&
    React.Children.toArray(children).every(
      (child) => typeof child === "string" && !child.includes("\n"),
    );

  return isInline ? (
    <CodeInline {...resolvedProps} />
  ) : (
    <CodeBlock {...(resolvedProps as ComponentProps<typeof CodeBlock>)} />
  );
}
