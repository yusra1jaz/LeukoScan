import React from 'react';

export default function dropdown-menu(props: any) {
  return (
    <div {...props} className={[props.className, "inline-block p-1"].filter(Boolean).join(" ")}>
      {props.children || "dropdown-menu"}
    </div>
  );
}
