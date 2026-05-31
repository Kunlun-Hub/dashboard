import React, { lazy, Suspense } from "react";
import SkeletonTable, {
  SkeletonTableHeader,
} from "@/components/skeletons/SkeletonTable";
import { Job } from "@/interfaces/Job";
import useFetchApi from "@/utils/api";

const PeerRemoteJobsTable = lazy(
  () => import("@/modules/jobs/table/PeerRemoteJobsTable"),
);
type Props = {
  peerID: string;
};

export const PeerRemoteJobsSection = ({ peerID }: Props) => {
  const { data: jobs, isLoading } = useFetchApi<Job[]>(`/peers/${peerID}/jobs`);

  return (
    <div className="pb-10 px-8">
      <div className="">
        <Suspense
          fallback={
            <div>
              <SkeletonTableHeader className="!p-0" />
              <div className="mt-8 w-full">
                <SkeletonTable withHeader={false} />
              </div>
            </div>
          }
        >
          <PeerRemoteJobsTable
            peerID={peerID}
            jobs={jobs}
            isLoading={isLoading}
          />
        </Suspense>
      </div>
    </div>
  );
};
