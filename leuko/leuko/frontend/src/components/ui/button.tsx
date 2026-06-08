import { forwardRef, ButtonHTMLAttributes, isValidElement, cloneElement } from "react";

type Variant = "default" | "outline" | "ghost" | "destructive";
type Size = "default" | "sm" | "icon";

const variantStyles: Record<Variant, string> = {
  default:
    "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-500",
  outline:
    "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-400",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-300",
  destructive:
    "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500",
};

const sizeStyles: Record<Size, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3 py-1 text-sm",
  icon: "h-9 w-9 p-2",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  // when true, the button will pass its classes to the child element
  asChild?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      children,
      variant = "default",
      size = "default",
      type = "button",
      asChild = false,
      ...rest
    },
    ref
  ) => {
    const classes = [
      "inline-flex items-center justify-center rounded-md font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
      variantStyles[variant],
      sizeStyles[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    if (asChild && isValidElement(children)) {
      // merge className into child element so Link or other components receive styling
      const child = children as any;
      const childClass = [child.props?.className, classes].filter(Boolean).join(" ");
      return cloneElement(child, { className: childClass });
    }

    return (
      <button ref={ref} type={type} className={classes} {...rest}>
        {children ?? "Button"}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
