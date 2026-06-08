import { ExternalLinkIcon } from "lucide-react";
import InlineLink from "@components/InlineLink";
import Paragraph from "@components/Paragraph";
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
      <div className={"flex justify-between items-center mb-5"}>
        <div>
          <Paragraph>
            Add resources to this network to control what peers can access.{" "}
            <InlineLink
              href={"https://docs.netbird.io/how-to/networks#resources"}
              target={"_blank"}
            >
              Learn more
              <ExternalLinkIcon size={12} />
            </InlineLink>
          </Paragraph>
        </div>
      </div>
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
