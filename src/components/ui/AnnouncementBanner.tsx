import InlineLink from "@components/InlineLink";
import { cn } from "@utils/helpers";
import { cva, VariantProps } from "class-variance-authority";
import { ArrowRightIcon, XIcon } from "lucide-react";
import * as React from "react";
import { useAnnouncement } from "@/contexts/AnnouncementProvider";
import { useI18n } from "@/i18n/I18nProvider";

const variants = cva(
  {},
  {
    variants: {
      variant: {
        default:
          "bg-white border-neutral-200 border-b text-neutral-700 dark:bg-nb-gray-900/50 dark:border-nb-gray-800/30 dark:text-nb-gray-200",
        important:
          "from-netbird to-netbird-400 bg-gradient-to-b text-black font-normal",
      },
      tagBadge: {
        default:
          "bg-neutral-100 text-neutral-700 font-medium dark:bg-nb-gray-200/10 dark:text-nb-gray-100",
        important: "bg-nb-gray-900 text-nb-gray-200 font-medium",
      },
      closeButton: {
        default:
          "bg-neutral-100 rounded-md p-1 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-nb-gray-900 dark:text-nb-gray-300 dark:hover:bg-nb-gray-800",
        important:
          "bg-netbird rounded-md p-1 text-nb-gray-900 hover:bg-nb-gray-900 hover:text-nb-gray-200",
      },
      inlineLink: {
        default: "text-netbird-700 hover:underline dark:text-nb-blue-400",
        important: "!text-black underline hover:opacity-80",
      },
    },
  },
);

export type AnnouncementVariant = VariantProps<typeof variants>;

export const AnnouncementBanner = () => {
  const { t } = useI18n();
  const { bannerHeight, closeAnnouncement, announcements } = useAnnouncement();
  const announcement = announcements?.find((a) => a.isOpen);

  return announcement ? (
    <div
      className={cn(
        "flex items-center justify-center text-sm px-8 font-light",
        variants({ variant: announcement.variant }),
      )}
      style={{ height: bannerHeight }}
    >
      <div className={"flex items-center gap-2"}>
        {announcement.tag && (
          <div
            className={cn(
              "backdrop-blur font-medium tracking-wide uppercase text-[10px] py-2.5 px-2 rounded-md leading-[0]",
              variants({ tagBadge: announcement.variant }),
            )}
          >
            {announcement.tag}
          </div>
        )}
        <div>
          {announcement.text}
          {announcement.link && (
            <InlineLink
              href={announcement.link || "#"}
              target={announcement.isExternal ? "_blank" : undefined}
              className={cn(
                "ml-2 !text-sm",
                variants({ inlineLink: announcement.variant }),
              )}
            >
              {announcement.linkText || t("globalSearch.open")}
              <ArrowRightIcon size={14} />
            </InlineLink>
          )}
        </div>
      </div>
      {announcement.closeable && (
        <div className={"absolute right-0 px-4"}>
          <div
            className={cn(
              "rounded-md p-1 transition-all cursor-pointer",
              variants({ closeButton: announcement.variant }),
            )}
            onClick={() => closeAnnouncement(announcement.hash)}
          >
            <XIcon size={14} />
          </div>
        </div>
      )}
    </div>
  ) : null;
};
