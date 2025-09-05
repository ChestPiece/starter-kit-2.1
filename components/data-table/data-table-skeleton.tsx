import React from "react";
import { Skeleton } from "../ui/skeleton";

/**
 * DataTableSkeleton component for showing loading state in tables
 * This component doesn't contain table structure elements to be flexible
 * It should be wrapped in appropriate table elements (tr/td) where it's used
 */
const DataTableSkeleton = ({ type }: { type: string }) => {
  const count = type === "selections" ? 5 : 10;

  return (
    <div className="animate-pulse w-full mb-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="h-[25px] mb-2">
          <Skeleton className="h-[20px] w-[97%] rounded-sm bg-primary/10" />
        </div>
      ))}
    </div>
  );
};

export default DataTableSkeleton;
