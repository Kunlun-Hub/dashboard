"use client";

import Button from "@components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@components/DropdownMenu";
import { cn } from "@utils/helpers";
import { isNetBirdHosted } from "@utils/netbird";
import {
  ArrowUpRightIcon,
  CircleQuestionMark,
  MailIcon,
  MessageSquareShare,
  MessagesSquareIcon,
} from "lucide-react";
import { useState } from "react";
import SlackIcon from "@/assets/icons/SlackIcon";
import { useI18n } from "@/i18n/I18nProvider";

export default function HelpAndSupportButton() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { t } = useI18n();

  return (
    <DropdownMenu
      modal={false}
      open={dropdownOpen}
      onOpenChange={setDropdownOpen}
    >
      <DropdownMenuTrigger asChild={true}>
        <Button
          size={"xs"}
          variant={"default-outline"}
          className={cn(
            "!rounded-full h-[38px] w-[38px] !p-0",
            dropdownOpen && "text-white",
          )}
        >
          <CircleQuestionMark size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1 px-1">
            <div className="text-sm font-normal leading-none text-neutral-900 py-1 dark:text-nb-gray-200">
              {t("help.title")}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isNetBirdHosted() && (
          <DropdownMenuItem href="mailto:support@netbird.io?subject=Support Request">
            <div className={"flex gap-3 items-center"}>
              <MailIcon size={14} />
              support@netbird.io
            </div>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          href="https://forum.netbird.io/"
          target="_blank"
          rel="noopener noreferrer"
          asChild
        >
          <div className={"flex gap-3 items-center"}>
            <MessagesSquareIcon size={14} />
            {t("help.forum")}
          </div>
          <DropdownMenuShortcut>
            <ArrowUpRightIcon size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          href={"https://forms.gle/TeLw2zrXEdw6RcQ36"}
          target={"_blank"}
          rel="noopener noreferrer"
          asChild
        >
          <div className={"flex gap-3 items-center"}>
            <MessageSquareShare size={14} />
            {t("help.feedback")}
          </div>
          <DropdownMenuShortcut>
            <ArrowUpRightIcon size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
