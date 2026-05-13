import Breadcrumbs from "@components/Breadcrumbs";
import Button from "@components/Button";
import { Checkbox } from "@components/Checkbox";
import { CommandItem } from "@components/Command";
import FancyToggleSwitch from "@components/FancyToggleSwitch";
import HelpText from "@components/HelpText";
import InlineLink from "@components/InlineLink";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { notify } from "@components/Notification";
import Paragraph from "@components/Paragraph";
import { Popover, PopoverContent, PopoverTrigger } from "@components/Popover";
import { ScrollArea } from "@components/ScrollArea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Select";
import { useExpirationState } from "@hooks/useExpirationState";
import { convertToSeconds } from "@hooks/useTimeFormatter";
import * as Tabs from "@radix-ui/react-tabs";
import { Command, CommandGroup, CommandList } from "cmdk";
import { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import {
  CalendarClock,
  ChevronsUpDown,
  ExternalLinkIcon,
  ShieldIcon,
  ShieldUserIcon,
  TimerResetIcon,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { useSWRConfig } from "swr";
import SettingsIcon from "@/assets/icons/SettingsIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useHasChanges } from "@/hooks/useHasChanges";
import { useEmbeddedIdentityProviders } from "@/hooks/useEmbeddedIdentityProviders";
import { useI18n } from "@/i18n/I18nProvider";
import { Account } from "@/interfaces/Account";
import { getSSOIdentityProviderLabelByType } from "@/interfaces/IdentityProvider";
import { useElementSize } from "@/hooks/useElementSize";

type Props = {
  account: Account;
};

interface LoginMethodSelectorProps {
  values: string[];
  onChange: (items: string[]) => void;
  disabled?: boolean;
  providers: any[] | undefined;
  localAuthDisabled: boolean;
}

function LoginMethodSelector({
  values,
  onChange,
  disabled = false,
  providers,
  localAuthDisabled,
}: LoginMethodSelectorProps) {
  const [inputRef, { width }] = useElementSize<HTMLButtonElement>();
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  const toggle = (option: string) => {
    const isSelected = values.find((o) => o === option) !== undefined;
    if (isSelected) {
      onChange && onChange(values.filter((o) => o !== option));
    } else {
      onChange && onChange([...values, option]);
    }
  };

  const selectAll = () => {
    onChange && onChange([]);
  };

  const getLabel = (option: string) => {
    if (option === "email") return "邮箱/密码登录";
    if (option.startsWith("provider:")) {
      const providerId = option.replace("provider:", "");
      const provider = providers?.find((p) => p.id === providerId);
      return provider?.name || getSSOIdentityProviderLabelByType(provider?.type) || providerId;
    }
    return option;
  };

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
      }}
    >
      <PopoverTrigger asChild={true}>
        <Button variant={"secondary"} disabled={disabled} ref={inputRef}>
          <Users size={16} className={"shrink-0"} />
          <div className={"w-full flex justify-between"}>
            {values.length > 0 ? (
              <div>{values.length} 种登录方式</div>
            ) : (
              "全部登录方式"
            )}
            <div className={"pl-2"}>
              <ChevronsUpDown size={18} className={"shrink-0"} />
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0 shadow-sm shadow-nb-gray-950"
        style={{
          width: width,
        }}
        align="start"
        side={"bottom"}
        sideOffset={10}
      >
        <Command className={"w-full flex"} loop>
          <CommandList className={"w-full"}>
            <ScrollArea
              className={
                "max-h-[380px] overflow-y-auto flex flex-col gap-1 pl-2 py-2 pr-3"
              }
            >
              <CommandGroup>
                <div className={"grid grid-cols-1 gap-1"}>
                  {/* "All" option */}
                  <CommandItem
                    key="all"
                    value="all"
                    className={"p-1"}
                    onSelect={selectAll}
                    onClick={(e) => e.preventDefault()}
                  >
                    <div
                      className={
                        "text-neutral-500 dark:text-nb-gray-300 font-medium flex items-center gap-3 py-1 px-1 w-full"
                      }
                    >
                      <Checkbox checked={values.length === 0} />
                      <div
                        className={
                          "flex justify-between items-center w-full"
                        }
                      >
                        <div
                          className={
                            "flex items-center gap-2 whitespace-nowrap text-sm font-normal"
                          }
                        >
                          全部（显示所有可用的登录方式）
                        </div>
                      </div>
                    </div>
                  </CommandItem>

                  {/* Email option */}
                  {!localAuthDisabled && (
                    <CommandItem
                      key="email"
                      value="email"
                      className={"p-1"}
                      onSelect={() => toggle("email")}
                      onClick={(e) => e.preventDefault()}
                    >
                      <div
                        className={
                          "text-neutral-500 dark:text-nb-gray-300 font-medium flex items-center gap-3 py-1 px-1 w-full"
                        }
                      >
                        <Checkbox checked={values.includes("email")} />
                        <div
                          className={
                            "flex justify-between items-center w-full"
                          }
                        >
                          <div
                            className={
                              "flex items-center gap-2 whitespace-nowrap text-sm font-normal"
                            }
                          >
                            邮箱/密码登录
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  )}

                  {/* Identity providers options */}
                  {providers?.map((provider) => {
                    const providerOption = `provider:${provider.id}`;
                    return (
                      <CommandItem
                        key={providerOption}
                        value={providerOption}
                        className={"p-1"}
                        onSelect={() => toggle(providerOption)}
                        onClick={(e) => e.preventDefault()}
                      >
                        <div
                          className={
                            "text-neutral-500 dark:text-nb-gray-300 font-medium flex items-center gap-3 py-1 px-1 w-full"
                          }
                        >
                          <Checkbox checked={values.includes(providerOption)} />
                          <div
                            className={
                              "flex justify-between items-center w-full"
                            }
                          >
                            <div
                              className={
                                "flex items-center gap-2 whitespace-nowrap text-sm font-normal"
                              }
                            >
                              {provider.name || getSSOIdentityProviderLabelByType(provider.type)}
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </div>
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function AuthenticationTab({ account }: Readonly<Props>) {
  const { permission } = usePermissions();
  const { t } = useI18n();
  const { providers } = useEmbeddedIdentityProviders();

  const { mutate } = useSWRConfig();

  const hasWeChatWorkProvider = !!providers?.some(
    (provider) => provider.type === "wechatwork",
  );
  const localAuthDisabled = account.settings.local_auth_disabled === true;
  const [loginMethod, setLoginMethod] = useState<"all" | "email" | "wechatwork">(
    () => account.settings.login_method || "all",
  );
  const [enabledLoginOptions, setEnabledLoginOptions] = useState<string[]>(
    () => account.settings.enabled_login_options || [],
  );

  /**
   * Peer approval enabled
   */
  const [peerApproval, setPeerApproval] = useState<boolean>(() => {
    try {
      return account?.settings?.extra?.peer_approval_enabled || false;
    } catch (error) {
      return false;
    }
  });

  /**
   * User approval required
   */
  const [userApprovalRequired, setUserApprovalRequired] = useState<boolean>(
    () => {
      try {
        return account?.settings?.extra?.user_approval_required || false;
      } catch (error) {
        return false;
      }
    },
  );

  // Peer Expiration
  const [
    loginExpiration,
    setLoginExpiration,
    expiresIn,
    setExpiresIn,
    expireInterval,
    setExpireInterval,
  ] = useExpirationState({
    enabled: account.settings.peer_login_expiration_enabled,
    expirationInSeconds: account.settings.peer_login_expiration || 86400,
  });

  // Peer Inactivity Expiration
  const [
    peerInactivityExpirationEnabled,
    setPeerInactivityExpirationEnabled,
    peerInactivityExpiresIn,
    peerInactivityExpireInterval,
  ] = useExpirationState({
    enabled: account.settings.peer_inactivity_expiration_enabled,
    expirationInSeconds: account.settings.peer_inactivity_expiration || 600,
    timeRange: ["minutes", "hours", "days"],
  });

  /**
   * Save changes
   */
  const saveRequest = useApiCall<Account>("/accounts/" + account.id);

  const { hasChanges, updateRef } = useHasChanges([
    loginMethod,
    enabledLoginOptions,
    peerApproval,
    userApprovalRequired,
    loginExpiration,
    expiresIn,
    expireInterval,
    peerInactivityExpirationEnabled,
    peerInactivityExpiresIn,
    peerInactivityExpireInterval,
  ]);

  const saveChanges = async () => {
    const expiration = convertToSeconds(expiresIn, expireInterval);

    notify({
      title: t("authenticationTab.saveTitle"),
      description: t("authenticationTab.saveDescription"),
      promise: saveRequest
        .put({
          id: account.id,
          settings: {
            ...account.settings,
            login_method: loginMethod,
            enabled_login_options: enabledLoginOptions.length > 0 ? enabledLoginOptions : undefined,
            peer_login_expiration_enabled: loginExpiration,
            peer_login_expiration: loginExpiration ? expiration : 86400,
            peer_inactivity_expiration_enabled: loginExpiration
              ? peerInactivityExpirationEnabled
              : false,
            peer_inactivity_expiration: 600,
            extra: {
              ...account.settings?.extra,
              peer_approval_enabled: peerApproval,
              user_approval_required: userApprovalRequired,
            },
          },
        } as Account)
        .then(() => {
          mutate("/accounts");
          updateRef([
            loginMethod,
            enabledLoginOptions,
            peerApproval,
            userApprovalRequired,
            loginExpiration,
            expiresIn,
            expireInterval,
            peerInactivityExpirationEnabled,
            peerInactivityExpiresIn,
            peerInactivityExpireInterval,
          ]);
        }),
      loadingMessage: t("authenticationTab.saving"),
    });
  };

  return (
    <Tabs.Content value={"authentication"}>
      <div className={"p-default py-6 max-w-2xl"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/settings"}
            label={t("settings.title")}
            icon={<SettingsIcon size={13} />}
          />
          <Breadcrumbs.Item
            href={"/settings"}
            label={t("settings.authentication")}
            icon={<ShieldIcon size={14} />}
            active
          />
        </Breadcrumbs>
        <div className={"flex items-start justify-between"}>
          <div>
            <h1>{t("settings.authentication")}</h1>
            <Paragraph>
              {t("common.learnMorePrefix")}
              <InlineLink
                href={
                  "https://docs.netbird.io/how-to/enforce-periodic-user-authentication"
                }
                target={"_blank"}
              >
                {t("settings.authentication")}
                <ExternalLinkIcon size={12} />
              </InlineLink>
            </Paragraph>
          </div>

          <Button
            variant={"primary"}
            disabled={!hasChanges || !permission.settings.update}
            onClick={saveChanges}
            data-cy={"save-authentication-settings"}
          >
            {t("actions.saveChanges")}
          </Button>
        </div>

        <div className={"flex flex-col gap-6 w-full mt-8 mb-3"}>
          {account.settings.embedded_idp_enabled && (
            <div className={"flex flex-col gap-3"}>
              <div>
                <Label>{t("authenticationTab.loginMethodLabel")}</Label>
                <HelpText>
                  选择允许的登录方式。如果只选择一种方式，登录时会直接跳转到该方式；如果选择多种方式，会显示所有选择的方式供用户选择。
                </HelpText>
              </div>
              
              <LoginMethodSelector
                values={enabledLoginOptions}
                onChange={setEnabledLoginOptions}
                disabled={!permission.settings.update}
                providers={providers}
                localAuthDisabled={localAuthDisabled}
              />
              
              {localAuthDisabled && (
                <HelpText>
                  {t("authenticationTab.loginMethodEmailDisabled")}
                </HelpText>
              )}
            </div>
          )}

          <div className={"flex flex-col"}>
            <FancyToggleSwitch
              value={userApprovalRequired}
              onChange={setUserApprovalRequired}
              dataCy={"user-approval-required"}
              label={
                <>
                  <ShieldUserIcon size={15} />
                  {t("authenticationTab.userApprovalLabel")}
                </>
              }
              helpText={
                <>
                  {t("authenticationTab.userApprovalHelpLine1")} <br />
                  {t("authenticationTab.userApprovalHelpLine2")}
                </>
              }
              disabled={!permission.settings.update}
            />
          </div>

          <div className={"flex flex-col"}>
            <FancyToggleSwitch
              value={loginExpiration}
              onChange={(state) => {
                setLoginExpiration(state);
                !state && setPeerInactivityExpirationEnabled(false);
              }}
              dataCy={"peer-login-expiration"}
              label={
                <>
                  <TimerResetIcon size={15} />
                  {t("authenticationTab.peerSessionLabel")}
                </>
              }
              helpText={
                <>
                  {t("authenticationTab.peerSessionHelpLine1")} <br />
                  {t("authenticationTab.peerSessionHelpLine2")}
                </>
              }
              disabled={!permission.settings.update}
            />

            <div
              className={cn(
                "border border-nb-gray-900 border-t-0 rounded-b-md bg-nb-gray-940 px-[1.28rem] pt-3 pb-5 flex flex-col gap-4 mx-[0.25rem]",
                !loginExpiration || !permission.settings.update
                  ? "opacity-50 pointer-events-none"
                  : "bg-nb-gray-930/80",
              )}
            >
              <div className={cn("flex justify-between gap-10 mt-2")}>
                <div className={"w-full"}>
                  <Label>{t("authenticationTab.sessionExpiration")}</Label>
                  <HelpText>
                    {t("authenticationTab.sessionExpirationHelp")}
                  </HelpText>
                </div>
                <div className={"w-full flex gap-3"}>
                  <Input
                    placeholder={"7"}
                    maxWidthClass={"min-w-[100px]"}
                    min={1}
                    disabled={!loginExpiration || !permission.settings.update}
                    data-cy={"peer-login-expiration-input"}
                    max={180}
                    className={"w-full"}
                    value={expiresIn}
                    type={"number"}
                    onChange={(e) => setExpiresIn(e.target.value)}
                  />
                  <Select
                    disabled={!loginExpiration || !permission.settings.update}
                    value={expireInterval}
                    onValueChange={(v) => setExpireInterval(v)}
                  >
                    <SelectTrigger
                      className="w-full"
                      data-cy={"peer-login-expiration-select"}
                    >
                      <div className={"flex items-center gap-3"}>
                        <CalendarClock
                          size={15}
                          className={"text-nb-gray-300"}
                        />
                        <SelectValue
                          placeholder={t("authenticationTab.selectInterval")}
                          data-cy={"peer-login-expiration-select-value"}
                        />
                      </div>
                    </SelectTrigger>
                    <SelectContent
                      data-cy={"peer-login-expiration-select-content"}
                    >
                      <SelectItem value="days">
                        {t("authenticationTab.days")}
                      </SelectItem>
                      <SelectItem value="hours">
                        {t("authenticationTab.hours")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <FancyToggleSwitch
                variant={"blank"}
                value={peerInactivityExpirationEnabled}
                onChange={setPeerInactivityExpirationEnabled}
                dataCy={"peer-inactivity-expiration"}
                label={<>{t("authenticationTab.requireLoginAfterDisconnect")}</>}
                disabled={!permission.settings.update}
                helpText={
                  <>
                    {t("authenticationTab.requireLoginAfterDisconnectHelp")}
                  </>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </Tabs.Content>
  );
}
