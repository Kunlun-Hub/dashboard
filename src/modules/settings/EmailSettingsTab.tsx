import Breadcrumbs from "@components/Breadcrumbs";
import Button from "@components/Button";
import FancyToggleSwitch from "@components/FancyToggleSwitch";
import HelpText from "@components/HelpText";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { notify } from "@components/Notification";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Select";
import { Textarea } from "@components/Textarea";
import FullScreenLoading from "@components/ui/FullScreenLoading";
import { useHasChanges } from "@hooks/useHasChanges";
import * as Tabs from "@radix-ui/react-tabs";
import useFetchApi, { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import {
  EyeIcon,
  MailIcon,
  RotateCcwIcon,
  SendIcon,
  ShieldAlertIcon,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import SettingsIcon from "@/assets/icons/SettingsIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import {
  EmailEncryption,
  EmailSettings,
  EmailSettingsUpdate,
  EmailTemplate,
  EmailTemplateKind,
  emailTemplateKinds,
  emailTemplateLabels,
  EmailTemplatePreview,
} from "@/interfaces/EmailSettings";

const emailSettingsPath = "/settings/email";

const defaultTemplateValues: Record<EmailTemplateKind, EmailTemplate> = {
  invite_user: {
    enabled: true,
    subject: "你被邀请加入 {{.account.name}}",
    body_html:
      '<p>{{.invite.created_by_name}} 邀请你加入 {{.account.name}}。</p><p><a href="{{.invite.url}}">接受邀请</a></p><p>邀请将在 {{.invite.expires_at}} 过期。</p>',
    body_text:
      "{{.invite.created_by_name}} 邀请你加入 {{.account.name}}。\n\n接受邀请：{{.invite.url}}\n\n邀请将在 {{.invite.expires_at}} 过期。",
  },
  create_user: {
    enabled: true,
    subject: "你的 Cloink 账号已创建",
    body_html:
      '<p>你的 Cloink 账号已创建。</p><p>账号：{{.user.email}}</p><p><a href="{{.dashboard.url}}">打开控制台</a></p>',
    body_text:
      "你的 Cloink 账号已创建。\n\n账号：{{.user.email}}\n控制台：{{.dashboard.url}}",
  },
  invite_accepted: {
    enabled: true,
    subject: "{{.user.email}} 已接受邀请",
    body_html:
      "<p>{{.user.name}}（{{.user.email}}）已接受邀请并完成注册。</p><p>时间：{{.time}}</p>",
    body_text:
      "{{.user.name}}（{{.user.email}}）已接受邀请并完成注册。\n\n时间：{{.time}}",
  },
  user_pending_approval: {
    enabled: true,
    subject: "有新用户等待审批",
    body_html:
      '<p>有新用户等待审批。</p><p>用户：{{.user.name}}（{{.user.email}}）</p><p><a href="{{.approval.url}}">前往审批</a></p>',
    body_text:
      "有新用户等待审批。\n\n用户：{{.user.name}}（{{.user.email}}）\n审批入口：{{.approval.url}}",
  },
  device_pending_approval: {
    enabled: true,
    subject: "有新设备等待审批",
    body_html:
      '<p>有新设备等待审批。</p><p>设备：{{.device.name}}</p><p>用户：{{.device.user_email}}</p><p><a href="{{.approval.url}}">前往审批</a></p>',
    body_text:
      "有新设备等待审批。\n\n设备：{{.device.name}}\n用户：{{.device.user_email}}\n审批入口：{{.approval.url}}",
  },
};

function normalizeSettings(settings?: EmailSettings): EmailSettings {
  return {
    enabled: settings?.enabled ?? false,
    host: settings?.host ?? "",
    port: settings?.port ?? 587,
    username: settings?.username ?? "",
    password_configured: settings?.password_configured ?? false,
    from_name: settings?.from_name ?? "Cloink",
    from_email: settings?.from_email ?? "",
    reply_to: settings?.reply_to ?? "",
    encryption: settings?.encryption ?? "starttls",
    insecure_skip_verify: settings?.insecure_skip_verify ?? false,
    admin_recipients: settings?.admin_recipients ?? [],
    templates: {
      ...defaultTemplateValues,
      ...(settings?.templates ?? {}),
    },
  };
}

function stringifyRecipients(recipients: string[]) {
  return recipients.join("\n");
}

function parseRecipients(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function EmailSettingsTab() {
  const { permission } = usePermissions();
  const { data, mutate, isLoading } = useFetchApi<EmailSettings>(
    emailSettingsPath,
    true,
  );
  const saveRequest = useApiCall<EmailSettings>(emailSettingsPath, true);
  const testRequest = useApiCall<Record<string, never>>(
    `${emailSettingsPath}/test`,
    true,
  );
  const previewRequest = useApiCall<EmailTemplatePreview>(
    `${emailSettingsPath}/templates`,
    true,
  );

  const initial = useMemo(() => normalizeSettings(data), [data]);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [host, setHost] = useState(initial.host);
  const [port, setPort] = useState(initial.port);
  const [username, setUsername] = useState(initial.username);
  const [password, setPassword] = useState("");
  const [clearPassword, setClearPassword] = useState(false);
  const [fromName, setFromName] = useState(initial.from_name);
  const [fromEmail, setFromEmail] = useState(initial.from_email);
  const [replyTo, setReplyTo] = useState(initial.reply_to);
  const [encryption, setEncryption] = useState<EmailEncryption>(
    initial.encryption,
  );
  const [insecureSkipVerify, setInsecureSkipVerify] = useState(
    initial.insecure_skip_verify,
  );
  const [adminRecipients, setAdminRecipients] = useState(
    stringifyRecipients(initial.admin_recipients),
  );
  const [templates, setTemplates] = useState<Record<string, EmailTemplate>>(
    initial.templates,
  );
  const [activeTemplate, setActiveTemplate] =
    useState<EmailTemplateKind>("invite_user");
  const [testRecipient, setTestRecipient] = useState("");
  const [preview, setPreview] = useState<EmailTemplatePreview>();

  React.useEffect(() => {
    const next = normalizeSettings(data);
    setEnabled(next.enabled);
    setHost(next.host);
    setPort(next.port);
    setUsername(next.username);
    setPassword("");
    setClearPassword(false);
    setFromName(next.from_name);
    setFromEmail(next.from_email);
    setReplyTo(next.reply_to);
    setEncryption(next.encryption);
    setInsecureSkipVerify(next.insecure_skip_verify);
    setAdminRecipients(stringifyRecipients(next.admin_recipients));
    setTemplates(next.templates);
  }, [data]);

  const changeState = [
    enabled,
    host,
    port,
    username,
    password,
    clearPassword,
    fromName,
    fromEmail,
    replyTo,
    encryption,
    insecureSkipVerify,
    adminRecipients,
    JSON.stringify(templates),
  ];
  const { hasChanges, updateRef } = useHasChanges(changeState);

  const activeTemplateValue = templates[activeTemplate] ??
    defaultTemplateValues[activeTemplate];

  const updateTemplate = (
    kind: EmailTemplateKind,
    update: Partial<EmailTemplate>,
  ) => {
    setTemplates((current) => ({
      ...current,
      [kind]: {
        ...(current[kind] ?? defaultTemplateValues[kind]),
        ...update,
      },
    }));
    setPreview(undefined);
  };

  const buildPayload = (): EmailSettingsUpdate => ({
    enabled,
    host: host.trim(),
    port: Number(port) || 587,
    username: username.trim(),
    password: password ? password : undefined,
    clear_password: clearPassword,
    from_name: fromName.trim(),
    from_email: fromEmail.trim(),
    reply_to: replyTo.trim(),
    encryption,
    insecure_skip_verify: insecureSkipVerify,
    admin_recipients: parseRecipients(adminRecipients),
    templates,
  });

  const saveChanges = () => {
    const payload = buildPayload();
    notify({
      title: "邮件通知设置",
      description: "SMTP 和邮件模板已更新。",
      promise: saveRequest.put(payload).then((next) => {
        mutate(next, false);
        const normalized = normalizeSettings(next);
        setPassword("");
        setClearPassword(false);
        updateRef([
          normalized.enabled,
          normalized.host,
          normalized.port,
          normalized.username,
          "",
          false,
          normalized.from_name,
          normalized.from_email,
          normalized.reply_to,
          normalized.encryption,
          normalized.insecure_skip_verify,
          stringifyRecipients(normalized.admin_recipients),
          JSON.stringify(normalized.templates),
        ]);
      }),
      loadingMessage: "正在保存邮件通知设置",
    });
  };

  const sendTestEmail = () => {
    notify({
      title: "测试邮件",
      description: "测试邮件已发送。",
      promise: testRequest.post({ recipient: testRecipient.trim() }),
      loadingMessage: "正在发送测试邮件",
    });
  };

  const previewTemplate = () => {
    const sampleData = {
      account: { name: "Cloink", domain: "example.com" },
      dashboard: { url: window.location.origin },
      user: {
        name: "张三",
        email: "hello@cloink.4w.ink",
        role: "user",
      },
      invite: {
        url: `${window.location.origin}/invite?token=nbi_demo`,
        expires_at: "2026-06-12 18:00:00 UTC",
        created_by_name: "管理员",
        created_by_email: "admin@example.com",
      },
      device: {
        id: "peer-demo",
        name: "DESKTOP-001",
        hostname: "DESKTOP-001",
        os: "Windows",
        user_email: "hello@cloink.4w.ink",
      },
      approval: { url: `${window.location.origin}/team?status=pending` },
      time: "2026-06-12 18:00:00 UTC",
    };
    notify({
      title: "模板预览",
      description: "模板已渲染。",
      promise: previewRequest
        .post({ data: sampleData }, `/${activeTemplate}/preview`)
        .then(setPreview),
      loadingMessage: "正在渲染模板",
    });
  };

  if (isLoading && !data) {
    return (
      <Tabs.Content value={"email"}>
        <FullScreenLoading />
      </Tabs.Content>
    );
  }

  return (
    <Tabs.Content value={"email"} className={"w-full"}>
      <div className={"p-default py-6 max-w-2xl"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/settings"}
            label={"设置"}
            icon={<SettingsIcon size={13} />}
          />
          <Breadcrumbs.Item
            href={"/settings?tab=email"}
            label={"邮件通知"}
            icon={<MailIcon size={14} />}
            active
          />
        </Breadcrumbs>

        <div className={"flex items-start justify-between gap-4"}>
          <div>
            <h1>邮件通知</h1>
            <p className={"text-sm text-neutral-500 dark:text-nb-gray-400 mt-2"}>
              配置 SMTP 服务和邀请、审批相关邮件模板。
            </p>
          </div>
          <Button
            variant={"primary"}
            disabled={!hasChanges || !permission.settings.update}
            onClick={saveChanges}
            data-cy={"save-email-settings"}
          >
            保存更改
          </Button>
        </div>

        <div className={"flex flex-col gap-8 w-full mt-8"}>
          <FancyToggleSwitch
            value={enabled}
            onChange={setEnabled}
            disabled={!permission.settings.update}
            dataCy={"email-enabled"}
            label={
              <>
                <MailIcon size={15} />
                启用邮件通知
              </>
            }
            helpText={"启用后，邀请、创建用户和待审批事件会按模板发送邮件。"}
          />

          <section className={"flex flex-col gap-4"}>
            <SectionTitle title={"SMTP 配置"} />
            <div className={"grid grid-cols-1 md:grid-cols-2 gap-4"}>
              <Field label={"SMTP Host"}>
                <Input
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  disabled={!permission.settings.update}
                  placeholder={"smtp.example.com"}
                />
              </Field>
              <Field label={"端口"}>
                <Input
                  type={"number"}
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  disabled={!permission.settings.update}
                />
              </Field>
              <Field label={"加密方式"}>
                <Select
                  value={encryption}
                  onValueChange={(value) =>
                    setEncryption(value as EmailEncryption)
                  }
                  disabled={!permission.settings.update}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={"starttls"}>STARTTLS</SelectItem>
                    <SelectItem value={"tls"}>TLS</SelectItem>
                    <SelectItem value={"none"}>不加密</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={"用户名"}>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!permission.settings.update}
                />
              </Field>
              <Field label={"密码"}>
                <Input
                  type={"password"}
                  showPasswordToggle
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (e.target.value) setClearPassword(false);
                  }}
                  disabled={!permission.settings.update || clearPassword}
                  placeholder={
                    initial.password_configured
                      ? "已配置，留空则不修改"
                      : "SMTP 密码"
                  }
                />
                {initial.password_configured && (
                  <button
                    type={"button"}
                    className={cn(
                      "mt-2 text-xs font-medium",
                      clearPassword
                        ? "text-red-600"
                        : "text-neutral-500 hover:text-red-600",
                    )}
                    onClick={() => {
                      setClearPassword(!clearPassword);
                      setPassword("");
                    }}
                    disabled={!permission.settings.update}
                  >
                    {clearPassword ? "保存后会清空密码" : "清空已保存密码"}
                  </button>
                )}
              </Field>
              <Field label={"发件人名称"}>
                <Input
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  disabled={!permission.settings.update}
                  placeholder={"Cloink"}
                />
              </Field>
              <Field label={"发件人邮箱"}>
                <Input
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  disabled={!permission.settings.update}
                  placeholder={"notice@example.com"}
                />
              </Field>
              <Field label={"Reply-To"}>
                <Input
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  disabled={!permission.settings.update}
                />
              </Field>
            </div>
            <FancyToggleSwitch
              value={insecureSkipVerify}
              onChange={setInsecureSkipVerify}
              disabled={!permission.settings.update}
              variant={"blank"}
              label={
                <>
                  <ShieldAlertIcon size={15} />
                  跳过 TLS 证书校验
                </>
              }
              helpText={"仅用于自签名或测试 SMTP 服务。生产环境不建议启用。"}
            />
            <Field label={"管理员收件人"}>
              <Textarea
                value={adminRecipients}
                onChange={(e) => setAdminRecipients(e.target.value)}
                disabled={!permission.settings.update}
                placeholder={"admin@example.com\nops@example.com"}
                className={"min-h-[96px]"}
                resize
              />
              <HelpText>每行一个邮箱。为空时，待审批提醒会发给账号管理员。</HelpText>
            </Field>
            <div className={"flex gap-3 items-end"}>
              <div className={"flex-1"}>
                <Field label={"测试收件人"}>
                  <Input
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    disabled={!permission.settings.update}
                    placeholder={"test@example.com"}
                  />
                </Field>
              </div>
              <Button
                variant={"secondary"}
                disabled={!testRecipient.trim() || !permission.settings.update}
                onClick={sendTestEmail}
              >
                <SendIcon size={15} />
                发送测试
              </Button>
            </div>
          </section>

          <section className={"flex flex-col gap-4"}>
            <SectionTitle title={"邮件模板"} />
            <div
              className={
                "grid grid-cols-1 md:grid-cols-[190px_minmax(0,1fr)] gap-4"
              }
            >
              <div className={"flex md:flex-col gap-2 overflow-x-auto"}>
                {emailTemplateKinds.map((kind) => (
                  <button
                    key={kind}
                    className={cn(
                      "rounded-md border px-3 py-2 text-left text-sm whitespace-nowrap",
                      activeTemplate === kind
                        ? "border-netbird-300 bg-netbird-50 text-netbird-700 dark:border-netbird-700 dark:bg-netbird-950/30 dark:text-netbird-200"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-nb-gray-800 dark:bg-nb-gray-900 dark:text-nb-gray-300",
                    )}
                    onClick={() => {
                      setActiveTemplate(kind);
                      setPreview(undefined);
                    }}
                    type={"button"}
                  >
                    {emailTemplateLabels[kind]}
                  </button>
                ))}
              </div>
              <div className={"flex flex-col gap-4 min-w-0"}>
                <div className={"flex items-center justify-between gap-3"}>
                  <FancyToggleSwitch
                    value={activeTemplateValue.enabled}
                    onChange={(value) =>
                      updateTemplate(activeTemplate, { enabled: value })
                    }
                    disabled={!permission.settings.update}
                    variant={"blank"}
                    label={emailTemplateLabels[activeTemplate]}
                    className={"!w-auto"}
                  />
                  <Button
                    variant={"secondary"}
                    onClick={() =>
                      updateTemplate(
                        activeTemplate,
                        defaultTemplateValues[activeTemplate],
                      )
                    }
                    disabled={!permission.settings.update}
                  >
                    <RotateCcwIcon size={15} />
                    恢复默认
                  </Button>
                </div>
                <Field label={"主题"}>
                  <Input
                    value={activeTemplateValue.subject}
                    onChange={(e) =>
                      updateTemplate(activeTemplate, {
                        subject: e.target.value,
                      })
                    }
                    disabled={!permission.settings.update}
                  />
                </Field>
                <Field label={"HTML 正文"}>
                  <Textarea
                    value={activeTemplateValue.body_html}
                    onChange={(e) =>
                      updateTemplate(activeTemplate, {
                        body_html: e.target.value,
                      })
                    }
                    disabled={!permission.settings.update}
                    className={"min-h-[150px] font-mono"}
                    resize
                  />
                </Field>
                <Field label={"Text 正文"}>
                  <Textarea
                    value={activeTemplateValue.body_text}
                    onChange={(e) =>
                      updateTemplate(activeTemplate, {
                        body_text: e.target.value,
                      })
                    }
                    disabled={!permission.settings.update}
                    className={"min-h-[120px] font-mono"}
                    resize
                  />
                </Field>
                <HelpText>
                  可用变量：{"{{.account.name}}"}、{"{{.dashboard.url}}"}、
                  {"{{.user.email}}"}、{"{{.invite.url}}"}、
                  {"{{.approval.url}}"}、{"{{.device.name}}"}。
                </HelpText>
                <div>
                  <Button
                    variant={"secondary"}
                    disabled={!permission.settings.update}
                    onClick={previewTemplate}
                  >
                    <EyeIcon size={15} />
                    预览模板
                  </Button>
                </div>
                {preview && (
                  <div
                    className={
                      "rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-nb-gray-800 dark:bg-nb-gray-900"
                    }
                  >
                    <div className={"font-medium text-neutral-900 dark:text-white"}>
                      {preview.subject}
                    </div>
                    <pre
                      className={
                        "mt-3 whitespace-pre-wrap rounded bg-white p-3 text-xs text-neutral-700 dark:bg-nb-gray-950 dark:text-nb-gray-200"
                      }
                    >
                      {preview.body_text || preview.body_html}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </Tabs.Content>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={"flex flex-col gap-2"}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className={"border-b border-neutral-200 pb-2 dark:border-nb-gray-800"}>
      <h2 className={"text-sm font-semibold text-neutral-900 dark:text-white"}>
        {title}
      </h2>
    </div>
  );
}

