import React from "react";
import { Skeleton } from "../ui/skeleton";
import { TableCell } from "../ui/table";

const DataTableSkeleton = ({ type }: { type: string }) => {
  return (
    <div className="animate-pulse w-full mb-4">
      {[...Array(type === "selections" ? 5 : 10)].map((_, i) => (
        <div key={i}>
          <TableCell className="h-[25px]">
            <Skeleton className="h-[20px] w-[97%] rounded-sm absolute bg-primary/10 " />
          </TableCell>
        </div>
      ))}
    </div>
  );
};

export default DataTableSkeleton;
