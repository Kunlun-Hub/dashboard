import { IconRepeat } from "@tabler/icons-react";
import { Repeat1 } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  current: number;
  limit: number;
  reusable: boolean;
};
export default function SetupKeyUsageCell({ current, limit, reusable }: Props) {
  const { t } = useI18n();
  const limitLabel = limit == 0 ? t("setupKey.unlimited") : String(limit);

  return reusable ? (
    <div
      className={
        "flex items-center text-[13px] text-neutral-600 dark:text-nb-gray-300 gap-2"
      }
    >
      <IconRepeat size={14} className={"text-green-400"} />
      <span>
        <span className={"font-medium text-neutral-800 dark:text-nb-gray-200"}>
          {" "}
          {current}{" "}
        </span>{" "}
        {t("setupKeys.usageLimitText", { limit: limitLabel })}
      </span>
    </div>
  ) : (
    <div
      className={
        "flex items-center text-[13px] text-neutral-600 dark:text-nb-gray-300 gap-2"
      }
    >
      <Repeat1 size={14} /> {t("setupKeys.oneOff")}
    </div>
  );
}
