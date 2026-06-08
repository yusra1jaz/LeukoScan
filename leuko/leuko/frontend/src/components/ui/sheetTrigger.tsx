import React from "react";

export default function SheetTrigger(props: any) {
  return (
    <div {...props} className={[props.className, "inline-block p-1 cursor-pointer"].filter(Boolean).join(" ")}>
      {props.children || "SheetTrigger"}
    </div>
  );
}
