"use client";

import { LabelHTMLAttributes, forwardRef } from "react";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ required, children, className = "", ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`
          block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1
          ${className}
        `}
        {...props}
      >
        {children}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>
    );
  }
);

Label.displayName = "Label";