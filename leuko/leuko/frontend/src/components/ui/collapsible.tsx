import React from "react";

export function Collapsible(props: any) {
  return (
    <div
      {...props}
      className={[props.className, "inline-block p-1"].filter(Boolean).join(" ")}
    >
      {props.children}
    </div>
  );
}

export function CollapsibleTrigger(props: any) {
  return (
    <button
      {...props}
      className={[props.className, "w-full text-left font-medium py-2"].filter(Boolean).join(" ")}
    >
      {props.children || "Trigger"}
    </button>
  );
}

export function CollapsibleContent(props: any) {
  return (
    <div
      {...props}
      className={[props.className, "p-2 text-sm text-muted-foreground"].filter(Boolean).join(" ")}
    >
      {props.children || "Content"}
    </div>
  );
}
