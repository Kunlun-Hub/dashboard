import { useOidc, useOidcUser } from "@axa-fr/react-oidc";
import Button from "@components/Button";
import Paragraph from "@components/Paragraph";
import loadConfig from "@utils/config";
import { ArrowRightIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { PublicBrandingIcon } from "@/modules/account/PublicBrandingProvider";

const config = loadConfig();

export const OIDCError = () => {
  const { t } = useI18n();
  const { oidcUserLoadingState } = useOidcUser();
  const params = useSearchParams();
  const errorParam = params.get("error");
  const accessDenied = errorParam === "access_denied";
  const invalidRequest = errorParam === "invalid_request";
  const [title, setTitle] = useState(params.get("error_description"));
  const errorDescription = params.get("error_description");
  const { logout } = useOidc();

  useEffect(() => {
    if (accessDenied) {
      if (title === "account linked successfully") {
        setTitle(t("auth.accountLinkedSuccessfully"));
      }
    } else {
      setTitle(t("auth.somethingWentWrong"));
    }
  }, [accessDenied, title, t]);

  return (
    <div
      className={
        "light-theme-surface flex h-screen flex-col items-center justify-center bg-neutral-50 px-4 text-neutral-900 dark:bg-nb-gray-950 dark:text-nb-gray-100"
      }
    >
      <div className={"flex w-full max-w-lg flex-col items-center"}>
        <div
          className={
            "bg-neutral-50 mb-3 border border-neutral-200 h-12 w-12 rounded-md flex items-center justify-center dark:bg-nb-gray-930 dark:border-nb-gray-900"
          }
        >
          <PublicBrandingIcon size={23} />
        </div>
        <h1 className={"text-center mt-2"}>{title}</h1>

        {accessDenied ? (
          <>
            <Paragraph className={"text-center mt-2"}>
              {t("auth.alreadyVerifiedEmail")}
            </Paragraph>

            <Button
              variant={"primary"}
              size={"sm"}
              className={"mt-5"}
              onClick={() => logout("/", { client_id: config.clientId })}
            >
              {t("actions.continue")}
              <ArrowRightIcon size={16} />
            </Button>

            <Button
              variant={"default-outline"}
              size={"sm"}
              className={"mt-5"}
              onClick={() => logout("/", { client_id: config.clientId })}
            >
              {t("auth.troubleLoggingIn")}
            </Button>
          </>
        ) : (
          <>
            <Paragraph className={"text-center mt-2 block"}>
              {t("auth.errorLoggingIn")} <br />
              {t("auth.error")}:
              {invalidRequest && errorDescription
                ? errorDescription
                : oidcUserLoadingState}
            </Paragraph>
            <Button
              variant={"primary"}
              size={"sm"}
              className={"mt-5"}
              onClick={() => logout("/", { client_id: config.clientId })}
            >
              {t("auth.logout")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
