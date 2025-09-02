import { cn } from "@/lib/utils";
import React from "react";

const Loader = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center py-8 h-[calc(100vh-200px)]",
        className
      )}
    >
      <div className="relative h-10 w-10">
        <div className="absolute h-full w-full rounded-full border-4 border-gray-200"></div>
        <div className="absolute h-full w-full rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
};

export default Loader;
