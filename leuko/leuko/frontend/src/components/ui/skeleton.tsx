import React from 'react';

export default function skeleton(props: any) {
  return (
    <div {...props} className={[props.className, "inline-block p-1"].filter(Boolean).join(" ")}>
      {props.children || "skeleton"}
    </div>
  );
}
