import React from 'react';

export default function toast(props: any) {
  return (
    <div {...props} className={[props.className, "inline-block p-1"].filter(Boolean).join(" ")}>
      {props.children || "toast"}
    </div>
  );
}
