import SkeletonTable, {
  SkeletonTableHeader,
} from "@components/skeletons/SkeletonTable";
import * as React from "react";
import { Suspense } from "react";
import { NetworkResource } from "@/interfaces/Network";
import ResourcesTable from "@/modules/networks/resources/ResourcesTable";

type ResourcesSectionProps = {
  data?: NetworkResource[];
  initialResourceId?: string;
  isLoading: boolean;
};

export const ResourcesTabContent = ({
  data,
  initialResourceId,
  isLoading,
}: ResourcesSectionProps) => {
  return (
    <div className={"px-8"}>
      <Suspense
        fallback={
          <div>
            <SkeletonTableHeader className={"!p-0"} />
            <div className={"mt-8 w-full"}>
              <SkeletonTable withHeader={false} />
            </div>
          </div>
        }
      >
        <ResourcesTable
          initialResourceId={initialResourceId}
          isLoading={isLoading}
          resources={data}
        />
      </Suspense>
    </div>
  );
};
