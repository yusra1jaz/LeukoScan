import React from 'react';

export default function sonner(props: any) {
  return (
    <div {...props} className={[props.className, "inline-block p-1"].filter(Boolean).join(" ")}>
      {props.children || "sonner"}
    </div>
  );
}
