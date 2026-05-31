import TextWithTooltip from "@components/ui/TextWithTooltip";
import useCopyToClipboard from "@hooks/useCopyToClipboard";
import { cn } from "@utils/helpers";
import { Copy } from "lucide-react";
import React from "react";
import { useI18n } from "@/i18n/I18nProvider";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function Card({ children, className, ...props }: Props) {
  return (
    <div
      {...props}
      className={cn(
        "w-1/2 overflow-hidden rounded-md border border-neutral-200 bg-white text-neutral-700 dark:border-nb-gray-900 dark:bg-nb-gray-940 dark:text-nb-gray-300",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CardList({ children }: Props) {
  return <ul className={"flex flex-col h-full justify-between"}>{children}</ul>;
}

type CardListItemProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  valueToCopy?: string;
  className?: string;
  copy?: boolean;
  copyText?: string;
  tooltip?: boolean;
  extraText?: string[];
};

function CardListItem({
  label,
  value,
  valueToCopy,
  className,
  copy = false,
  copyText,
  tooltip = true,
  extraText = [],
}: CardListItemProps) {
  return (
    <li
      className={cn(
        "flex justify-between px-4 border-b border-neutral-200 py-3.5 last:border-b-0 items-center h-full dark:border-nb-gray-900",
        className,
      )}
    >
      <div className={"flex items-center gap-2.5 text-[0.84rem] text-neutral-700 dark:text-nb-gray-300"}>
        {label}
      </div>
      <div className={"flex flex-col gap-2"}>
        <CardTextItem
          label={label}
          value={value}
          valueToCopy={valueToCopy}
          copy={copy}
          copyText={copyText}
          tooltip={tooltip}
        />
        {extraText?.map((extraLabel, index) => (
          <CardTextItem
            key={index}
            label={label}
            value={extraLabel}
            copy={copy}
            copyText={copyText}
            tooltip={tooltip}
          />
        ))}
      </div>
    </li>
  );
}

type CardTextItemProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  valueToCopy?: string;
  copy?: boolean;
  copyText?: string;
  tooltip?: boolean;
};

const CardTextItem = ({
  label,
  value,
  copy = false,
  valueToCopy,
  copyText,
  tooltip = true,
}: CardTextItemProps) => {
  const { t } = useI18n();
  const [, copyToClipBoard] = useCopyToClipboard(valueToCopy ?? `${value}`);
  return (
    <div
      className={cn(
        "text-right text-neutral-500 text-[0.84rem] flex items-center gap-2 dark:text-nb-gray-400",
        copy && "cursor-pointer hover:text-neutral-700 transition-all dark:hover:text-nb-gray-300",
      )}
      onClick={() =>
        copy &&
        copyToClipBoard(
          `${copyText ? copyText : label} ${t('common.copiedToClipboard')}`,
        )
      }
    >
      {tooltip ? (
        <TextWithTooltip text={value as string} maxChars={40} />
      ) : (
        value
      )}
      {copy && <Copy size={13} className={"shrink-0"} />}
    </div>
  );
};

Card.List = CardList;
Card.ListItem = CardListItem;

export default Card;
