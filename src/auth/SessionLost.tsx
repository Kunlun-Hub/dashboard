import { useOidc } from "@axa-fr/react-oidc";
import Button from "@components/Button";
import Paragraph from "@components/Paragraph";
import loadConfig from "@utils/config";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useEffect } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { PublicBrandingIcon } from "@/modules/account/PublicBrandingProvider";

const config = loadConfig();

export const SessionLost = () => {
  const router = useRouter();
  const { logout } = useOidc();
  const { t } = useI18n();

  useEffect(() => {
    router.push("/peers");
  });

  return (
    <div
      className={
        "light-theme-surface flex h-screen flex-col items-center justify-center bg-neutral-50 px-4 text-neutral-900 dark:bg-nb-gray-950 dark:text-nb-gray-100"
      }
    >
      <div className={"flex w-full max-w-md flex-col items-center"}>
        <div
          className={
            "bg-neutral-50 mb-3 border border-neutral-200 h-10 w-10 rounded-md flex items-center justify-center dark:bg-nb-gray-930 dark:border-nb-gray-900"
          }
        >
          <PublicBrandingIcon size={20} />
        </div>
        <h1>{t("session.expiredTitle")}</h1>
        <Paragraph className={"text-center"}>
          {t("session.expiredDescription")}
        </Paragraph>
        <Button
          variant={"primary"}
          size={"sm"}
          className={"mt-5"}
          onClick={() => logout("", { client_id: config.clientId })}
        >
          {t("session.login")}
          <LogIn size={16} />
        </Button>
      </div>
    </div>
  );
};
