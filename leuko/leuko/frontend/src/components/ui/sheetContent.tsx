import React from "react";

export default function SheetContent(props: any) {
  return (
    <div {...props} className={[props.className, "inline-block p-4 bg-white rounded shadow-lg"].filter(Boolean).join(" ")}>
      {props.children || "SheetContent"}
    </div>
  );
}
