import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/Tooltip";
import { Barcode, CpuIcon } from "lucide-react";
import Image from "next/image";
import React, { useMemo } from "react";
import { FaWindows } from "react-icons/fa6";
import { FcAndroidOs, FcLinux } from "react-icons/fc";
import IOSIcon from "@/assets/icons/IOSIcon";
import AppleLogo from "@/assets/os-icons/apple.svg";
import FreeBSDLogo from "@/assets/os-icons/FreeBSD.png";
import { getOperatingSystem } from "@/hooks/useOperatingSystem";
import { useI18n } from "@/i18n/I18nProvider";
import { OperatingSystem } from "@/interfaces/OperatingSystem";

type Props = {
  os: string;
  serial?: string;
};
export function PeerOSCell({ os, serial }: Readonly<Props>) {
  const { t } = useI18n();
  return (
    <TooltipProvider>
      <Tooltip delayDuration={1}>
        <TooltipTrigger>
          <div
            className={
              "flex items-center gap-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-nb-gray-800/60 dark:hover:text-neutral-100 transition-all py-2 px-3 rounded-md"
            }
          >
            <div
              className={
                "h-6 w-6 flex items-center justify-center grayscale brightness-[100%] contrast-[40%]"
              }
            >
              <OSLogo os={os} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className={"!p-0"}>
          <div>
            <ListItem icon={<CpuIcon size={14} />} label={t("table.os")} value={os} />
            {serial && serial !== "" && (
              <ListItem
                icon={<Barcode size={14} />}
                label={t("table.serialNumber")}
                value={serial}
              />
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const ListItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
}) => {
  return (
    <div
      className={
        "flex justify-between gap-5 border-b border-neutral-200 px-4 py-2 text-xs last:border-b-0 dark:border-nb-gray-920"
      }
    >
      <div
        className={
          "flex items-center gap-2 font-medium text-neutral-900 dark:text-nb-gray-100"
        }
      >
        {icon}
        {label}
      </div>
      <div className={"text-neutral-500 dark:text-nb-gray-400"}>{value}</div>
    </div>
  );
};

export function OSLogo({ os }: { os: string }) {
  const icon = useMemo(() => {
    return getOperatingSystem(os);
  }, [os]);

  if (icon === OperatingSystem.WINDOWS)
    return <FaWindows className={"text-neutral-700 dark:text-white text-lg"} />;
  if (icon === OperatingSystem.APPLE)
    return <Image src={AppleLogo} alt={""} width={14} />;
  if (icon === OperatingSystem.FREEBSD)
    return <Image src={FreeBSDLogo} alt={""} width={18} />;
  if (icon === OperatingSystem.IOS)
    return <IOSIcon className={"fill-neutral-700 dark:fill-white"} size={20} />;
  if (icon === OperatingSystem.ANDROID)
    return <FcAndroidOs className={"text-neutral-700 dark:text-white text-2xl dark:brightness-200"} />;

  return <FcLinux className={"text-neutral-700 dark:text-white text-2xl dark:brightness-150"} />;
}
