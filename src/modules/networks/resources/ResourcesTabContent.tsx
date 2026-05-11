import InlineLink from "@components/InlineLink";
import Paragraph from "@components/Paragraph";
import SkeletonTable, {
  SkeletonTableHeader,
} from "@components/skeletons/SkeletonTable";
import { ExternalLinkIcon } from "lucide-react";
import * as React from "react";
import { Suspense } from "react";
import { useI18n } from "@/i18n/I18nProvider";
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
  const { t } = useI18n();
  return (
    <div className={"px-8"}>
      <div className={"flex justify-between items-center mb-5"}>
        <div>
          <Paragraph>
            {t("resourcesTable.networkDescription")}
          </Paragraph>
          <Paragraph>
            {t("common.learnMorePrefix")}{" "}
            <InlineLink
              href={"https://docs.netbird.io/how-to/networks#resources"}
              target={"_blank"}
            >
              {t("networkResources.linkLabel")}
              <ExternalLinkIcon size={12} />
            </InlineLink>
            {t("common.inDocumentationSuffix")}
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
