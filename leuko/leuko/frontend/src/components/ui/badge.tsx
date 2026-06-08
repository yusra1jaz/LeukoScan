import React from "react";

export function Badge(props: any) {
  return (
    <div
      {...props}
      className={[props.className, "inline-block p-1"]
        .filter(Boolean)
        .join(" ")}
    >
      {props.children || "badge"}
    </div>
  );
}
