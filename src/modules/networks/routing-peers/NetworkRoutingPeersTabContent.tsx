import SkeletonTable, {
  SkeletonTableHeader,
} from "@components/skeletons/SkeletonTable";
import useFetchApi from "@utils/api";
import * as React from "react";
import { Suspense, useMemo } from "react";
import { useGroups } from "@/contexts/GroupsProvider";
import { useUsers } from "@/contexts/UsersProvider";
import { NetworkRouter } from "@/interfaces/Network";
import { Peer } from "@/interfaces/Peer";
import NetworkRoutingPeersTable from "@/modules/networks/routing-peers/NetworkRoutingPeersTable";

export const NetworkRoutingPeersTabContent = ({
  routers,
  isLoading,
}: {
  routers?: NetworkRouter[];
  isLoading: boolean;
}) => {
  const { groups } = useGroups();
  const { users } = useUsers();
  const { data: peers } = useFetchApi<Peer[]>(`/peers`);

  const data = useMemo(() => {
    return routers?.map((router) => {
      const peer = peers?.find((peer) => peer.id === router.peer);
      const user = peer ? users?.find((user) => user.id === peer.user_id) : undefined;
      const group = groups?.find(
        (group) => group.id === router?.peer_groups?.[0],
      );

      return {
        ...router,
        search: `${peer?.name ?? ""} ${peer?.ip ?? ""} ${peer?.ipv6 ?? ""} ${user?.name ?? ""} ${user?.id ?? ""} ${group?.name ?? ""}`,
      };
    });
  }, [users, peers, routers, groups]);

  return (
    <div className={"px-8"} id={"routing-peers"}>
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
        <NetworkRoutingPeersTable isLoading={isLoading} routers={data} />
      </Suspense>
    </div>
  );
};
