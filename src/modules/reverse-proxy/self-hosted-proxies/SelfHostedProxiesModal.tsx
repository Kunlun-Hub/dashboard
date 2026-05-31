import Button from "@components/Button";
import { Callout } from "@components/Callout";
import CardTable from "@components/CardTable";
import Code from "@components/Code";
import HelpText from "@components/HelpText";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import { notify } from "@components/Notification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/Tabs";
import { cn, validator } from "@utils/helpers";
import {
  GlobeIcon,
  ListIcon,
  Loader2,
  ServerIcon,
  SquareTerminalIcon,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { useI18n } from "@/i18n/I18nProvider";
import { ReverseProxyClusterToken } from "@/interfaces/ReverseProxy";
import { useApiCall } from "@/utils/api";
import { GRPC_API_ORIGIN, isNetBirdHosted } from "@/utils/netbird";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const SelfHostedProxiesModal = ({ open, onOpenChange }: Props) => {
  const { mutate } = useSWRConfig();
  const { t } = useI18n();
  const [tab, setTab] = useState("domain");
  const [domain, setDomain] = useState("");
  const [token, setToken] = useState("");
  const [isGeneratingToken, setIsGeneratingToken] = useState(true);

  const tokenRequest = useApiCall<ReverseProxyClusterToken>(
    "/reverse-proxies/proxy-tokens",
  );

  const domainError = useMemo(() => {
    if (!domain) return "";
    const isValid = validator.isValidDomain(domain, {
      allowWildcard: false,
      allowOnlyTld: false,
      preventLeadingAndTrailingDots: true,
    });
    if (!isValid) {
      return t("reverseProxy.customDomainError");
    }
    return "";
  }, [domain, t]);

  const managementUrl = isNetBirdHosted()
    ? "https://api.netbird.io"
    : GRPC_API_ORIGIN || "";

  const dockerCommand = `docker run -d \\
 -v /var/lib/certs:/certs \\
 -e NB_PROXY_CERTIFICATE_DIRECTORY=/certs \\
 -e NB_PROXY_ALLOW_INSECURE=true \\
 -e NB_PROXY_MANAGEMENT_ADDRESS=${managementUrl} \\
 -e NB_PROXY_ACME_CERTIFICATES=true \\
 -e NB_PROXY_DOMAIN=${domain} \\
 -e NB_PROXY_LOG_LEVEL=info \\
 -e NB_PROXY_TOKEN=${token || "<TOKEN>"} \\
 -p 80:80 -p 443:443 \\
 netbirdio/reverse-proxy:latest`;

  const generateToken = useCallback(async () => {
    setIsGeneratingToken(true);
    const promise = tokenRequest
      .post({
        name: domain,
        expires_in: 0,
      })
      .then((res) => {
        setToken(res?.plain_token ?? "");
      })
      .finally(() => {
        setIsGeneratingToken(false);
      });

    notify({
      title: t("reverseProxy.proxyToken"),
      description: t("reverseProxy.proxyTokenFailed"),
      promise,
      loadingMessage: t("reverseProxy.proxyTokenGenerating"),
      showOnlyError: true,
      preventSuccessToast: true,
    });
    return promise;
  }, [domain, t, tokenRequest]);

  const goToInstall = useCallback(() => {
    setTab("install");
    if (!token) generateToken();
  }, [token, generateToken]);

  const finishSetup = () => {
    onOpenChange(false);
    mutate("/reverse-proxies/clusters");
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent maxWidthClass={"relative max-w-[600px]"} showClose={true}>
        <ModalHeader
          icon={<ServerIcon size={16} />}
          title={t("reverseProxy.setupProxy")}
          description={t("reverseProxy.setupProxyDescription")}
          color={"netbird"}
        />

        <Tabs
          value={tab}
          onValueChange={(v) => (v === "install" ? goToInstall() : setTab(v))}
        >
          <TabsList justify={"start"} className={"px-8"}>
            <TabsTrigger value={"domain"}>
              <GlobeIcon size={14} />
              {t("reverseProxy.domain")}
            </TabsTrigger>
            <TabsTrigger
              value={"dns"}
              disabled={!domain.trim() || !!domainError}
            >
              <ListIcon size={14} />
              {t("dns.records")}
            </TabsTrigger>
            <TabsTrigger
              value={"install"}
              disabled={!domain.trim() || !!domainError}
            >
              <SquareTerminalIcon size={14} />
              {t("reverseProxy.runProxy")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={"domain"} className={"pb-8"}>
            <div className={"px-8 flex flex-col gap-6"}>
              <div>
                <Label>{t("reverseProxy.domain")}</Label>
                <HelpText>{t("reverseProxy.selfHostedDomainHelp")}</HelpText>
                <Input
                  autoFocus={true}
                  placeholder={t("reverseProxy.selfHostedDomainPlaceholder")}
                  value={domain}
                  error={domainError}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDomain(e.target.value)
                  }
                />
              </div>
              <Callout variant={"info"}>
                {t("reverseProxy.selfHostedRequirements")}
                <ul className={"list-disc pl-4 mt-2 flex flex-col gap-1"}>
                  <li>
                    <span className={"text-neutral-900 dark:text-white font-medium"}>
                      {t("reverseProxy.publiclyAccessibleIp")}
                    </span>
                  </li>
                  <li>
                    <span className={"text-neutral-900 dark:text-white font-medium"}>Docker</span>{" "}
                    {t("reverseProxy.dockerInstalled")}
                  </li>
                  <li>
                    <span className={"text-neutral-900 dark:text-white font-medium"}>
                      {t("reverseProxy.ports80And443")}
                    </span>{" "}
                    {t("reverseProxy.portsOpen")}
                  </li>
                </ul>
              </Callout>
            </div>
          </TabsContent>

          <TabsContent value={"dns"} className={"pb-8"}>
            <div className={"px-8 flex flex-col"}>
              <div>
                <Label>{t("reverseProxy.configureDns")}</Label>
                <HelpText>{t("reverseProxy.configureDnsHelp")}</HelpText>
              </div>
              <CardTable>
                <CardTable.Header>
                  <CardTable.HeaderCell width={120}>
                    {t("table.type")}
                  </CardTable.HeaderCell>
                  <CardTable.HeaderCell>{t("table.name")}</CardTable.HeaderCell>
                  <CardTable.HeaderCell>
                    {t("table.content")}
                  </CardTable.HeaderCell>
                </CardTable.Header>
                <CardTable.Body>
                  <CardTable.Row>
                    <CardTable.Cell>{t("reverseProxy.aRecord")}</CardTable.Cell>
                    <CardTable.Cell copy copyText={domain}>
                      {domain}
                    </CardTable.Cell>
                    <CardTable.Cell className={"italic"}>
                      {t("reverseProxy.yourMachineIp")}
                    </CardTable.Cell>
                  </CardTable.Row>
                  <CardTable.Row>
                    <CardTable.Cell>{t("reverseProxy.aRecord")}</CardTable.Cell>
                    <CardTable.Cell copy copyText={`*.${domain}`}>
                      {`*.${domain}`}
                    </CardTable.Cell>
                    <CardTable.Cell className={"italic"}>
                      {t("reverseProxy.yourMachineIp")}
                    </CardTable.Cell>
                  </CardTable.Row>
                </CardTable.Body>
              </CardTable>
            </div>
          </TabsContent>

          <TabsContent value={"install"} className={"pb-8"}>
            <div className={"px-8 flex flex-col"}>
              <div>
                <Label>{t("reverseProxy.runProxyWithDocker")}</Label>
                <HelpText>{t("reverseProxy.runProxyWithDockerHelp")}</HelpText>
              </div>
              <Code
                codeToCopy={dockerCommand}
                className={cn(
                  "overflow-hidden",
                  isGeneratingToken && "!border-nb-gray-930",
                )}
                showCopyIcon={!isGeneratingToken}
              >
                {isGeneratingToken && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-neutral-900 bg-white/90 dark:text-nb-gray-100 dark:bg-nb-gray-950/90">
                    <Loader2 size={16} className="animate-spin" />
                    {t("reverseProxy.proxyTokenGenerating")}
                  </div>
                )}

                <Code.Line>docker run -d \</Code.Line>
                <Code.Line> -v /var/lib/certs:/certs \</Code.Line>
                <Code.Line>
                  {" "}
                  -e NB_PROXY_CERTIFICATE_DIRECTORY=/certs \
                </Code.Line>
                <Code.Line> -e NB_PROXY_ALLOW_INSECURE=true \</Code.Line>
                <Code.Line>
                  {" "}
                  -e NB_PROXY_MANAGEMENT_ADDRESS=
                  <span className={"text-netbird"}>{managementUrl}</span> \
                </Code.Line>
                <Code.Line> -e NB_PROXY_ACME_CERTIFICATES=true \</Code.Line>
                <Code.Line>
                  {" "}
                  -e NB_PROXY_DOMAIN=
                  <span className={"text-netbird"}>{domain}</span> \
                </Code.Line>
                <Code.Line> -e NB_PROXY_LOG_LEVEL=info \</Code.Line>
                <Code.Line>
                  {" "}
                  -e NB_PROXY_TOKEN=
                  <span className={"text-netbird"}>{token || "<TOKEN>"}</span> \
                </Code.Line>
                <Code.Line> -p 80:80 -p 443:443 \</Code.Line>
                <Code.Line> netbirdio/reverse-proxy:latest</Code.Line>
              </Code>
            </div>
          </TabsContent>
        </Tabs>

        <ModalFooter className={"items-center"}>
          <div className={"flex gap-3 w-full justify-end"}>
            {tab === "domain" && (
              <>
                <ModalClose asChild={true}>
                  <Button variant={"secondary"}>{t("actions.cancel")}</Button>
                </ModalClose>
                <Button
                  variant={"primary"}
                  onClick={() => setTab("dns")}
                  disabled={!domain.trim() || !!domainError}
                >
                  {t("actions.continue")}
                </Button>
              </>
            )}
            {tab === "dns" && (
              <>
                <Button variant={"secondary"} onClick={() => setTab("domain")}>
                  {t("actions.back")}
                </Button>
                <Button variant={"primary"} onClick={goToInstall}>
                  {t("actions.continue")}
                </Button>
              </>
            )}
            {tab === "install" && (
              <>
                <Button variant={"secondary"} onClick={() => setTab("dns")}>
                  {t("actions.back")}
                </Button>
                <Button variant={"primary"} onClick={finishSetup}>
                  {t("reverseProxy.finishSetup")}
                </Button>
              </>
            )}
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
