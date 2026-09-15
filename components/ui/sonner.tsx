"use client";

import { Toaster as Sonner, toast as t } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return <Sonner className="toaster group" {...props} />;
};

export { Toaster, t as toast };
