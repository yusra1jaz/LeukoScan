import React, { InputHTMLAttributes } from "react";

// Named export
export function Input(props: InputHTMLAttributes<HTMLInputElement>): JSX.Element {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
