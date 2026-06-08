import React from 'react';

export default function calendar(props: any) {
  return (
    <div {...props} className={[props.className, "inline-block p-1"].filter(Boolean).join(" ")}>
      {props.children || "calendar"}
    </div>
  );
}
