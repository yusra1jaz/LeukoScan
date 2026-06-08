import React from "react";

export function Accordion(props: any) {
  return (
    <div
      {...props}
      className={[props.className, "space-y-2"].filter(Boolean).join(" ")}
    >
      {props.children}
    </div>
  );
}

export function AccordionItem(props: any) {
  return (
    <div
      {...props}
      className={[props.className, "border-b rounded-md"].filter(Boolean).join(" ")}
    >
      {props.children}
    </div>
  );
}

export function AccordionTrigger(props: any) {
  return (
    <button
      {...props}
      className={[props.className, "w-full text-left font-medium py-2"].filter(Boolean).join(" ")}
    >
      {props.children}
    </button>
  );
}

export function AccordionContent(props: any) {
  return (
    <div
      {...props}
      className={[props.className, "p-2 text-sm text-muted-foreground"].filter(Boolean).join(" ")}
    >
      {props.children}
    </div>
  );
}
