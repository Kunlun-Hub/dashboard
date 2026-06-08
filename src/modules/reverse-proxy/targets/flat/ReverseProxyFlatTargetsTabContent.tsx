import { ExternalLinkIcon } from "lucide-react";
import InlineLink from "@components/InlineLink";
import Paragraph from "@components/Paragraph";
import SkeletonTable, {
  SkeletonTableHeader,
} from "@components/skeletons/SkeletonTable";
import * as React from "react";
import { Suspense } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import {
  REVERSE_PROXY_DOCS_LINK,
  ReverseProxyFlatTarget,
} from "@/interfaces/ReverseProxy";
import { ReverseProxyFlatTargetsTable } from "@/modules/reverse-proxy/targets/flat/ReverseProxyFlatTargetsTable";

type Props = {
  targets: ReverseProxyFlatTarget[];
  isLoading?: boolean;
  hideResourceColumn?: boolean;
  initialTargetId?: string;
  emptyTableTitle?: string;
  emptyTableDescription?: string;
};

export const ReverseProxyFlatTargetsTabContent = ({
  targets,
  isLoading,
  hideResourceColumn,
  initialTargetId,
  emptyTableTitle,
  emptyTableDescription,
}: Props) => {
  const { t } = useI18n();
  return (
    <div className={"pb-10 px-8"}>
      <div className={"flex justify-between items-center mb-5"}>
        <div>
          <Paragraph>
            Expose services securely through NetBird&apos;s reverse proxy.{" "}
            <InlineLink href={REVERSE_PROXY_DOCS_LINK} target={"_blank"}>
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
        <ReverseProxyFlatTargetsTable
          targets={targets}
          initialTargetId={initialTargetId}
          isLoading={isLoading}
          hideResourceColumn={hideResourceColumn}
          emptyTableTitle={emptyTableTitle ?? t("reverseProxyTargets.emptyTitle")}
          emptyTableDescription={
            emptyTableDescription ?? t("reverseProxyTargets.emptyDescription")
          }
        />
      </Suspense>
    </div>
  );
};
