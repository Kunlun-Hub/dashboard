"use client";

import Button from "@components/Button";
import HelpText from "@components/HelpText";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { cn } from "@utils/helpers";
import { CheckCircle2, Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { ApiError, SetupRequest } from "@/interfaces/Instance";
import { PublicBrandingLogo } from "@/modules/account/PublicBrandingProvider";
import { submitSetup } from "@/utils/unauthenticatedApi";

interface FormData {
  email: string;
  password: string;
  name: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  general?: string;
}

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/i;

export default function InstanceSetupWizard() {
  const { t } = useI18n();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    name: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = t("instanceSetup.emailRequired");
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t("instanceSetup.invalidEmail");
    }

    if (!formData.password) {
      newErrors.password = t("instanceSetup.passwordRequired");
    } else if (formData.password.length < 8) {
      newErrors.password = t("instanceSetup.passwordMinLength");
    }

    if (!formData.name.trim()) {
      newErrors.name = t("instanceSetup.nameRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const request: SetupRequest = {
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
      };

      await submitSetup(request);
      setIsSuccess(true);
    } catch (err) {
      const error = err as ApiError;
      let message = t("instanceSetup.genericError");

      switch (error.code) {
        case 400:
          message = t("instanceSetup.invalidRequest");
          break;
        case 412:
          message = t("instanceSetup.alreadyCompleted");
          setTimeout(() => (window.location.href = "/"), 2000);
          break;
        case 422:
          message = error.message || t("instanceSetup.validationError");
          break;
        case 500:
          message = t("instanceSetup.genericError");
          break;
        default:
          message = error.message || message;
      }

      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isSuccess) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Full page reload to get fresh instance status from API
          window.location.href = "/";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess]);

  const handleInputChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  if (isSuccess) {
    return (
      <div className="light-theme-surface min-h-screen bg-neutral-50 px-4 py-20 text-neutral-950 dark:bg-nb-gray-950 dark:text-nb-gray-100">
        <div className={"flex items-center justify-center"}>
          <PublicBrandingLogo size={"large"} mobile={false} />
        </div>
        <Card className={"max-w-[360px] mt-8 mx-auto"}>
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-4 mx-auto">
            <CheckCircle2 className="text-green-500" size={22} />
          </div>
          <h1 className={"text-xl text-center z-10 relative"}>
            {t("instanceSetup.accountCreated")}
          </h1>
          <div
            className={
              "text-sm text-neutral-500 font-light mt-2 block text-center z-10 relative dark:text-nb-gray-300"
            }
          >
            {t("instanceSetup.redirectingToLoginIn")}{" "}
            <span className={"text-neutral-950 font-medium dark:text-white"}>
              {countdown}s
            </span>
            ...
          </div>
          <div className={"flex items-center justify-center mt-4"}>
            <Button
              type="button"
              onClick={() => (window.location.href = "/")}
              variant={"primary"}
              className={"mx-auto w-full"}
            >
              {t("instanceSetup.goToLogin")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="light-theme-surface min-h-screen bg-neutral-50 px-4 py-20 text-neutral-950 dark:bg-nb-gray-950 dark:text-nb-gray-100">
      <div className={"flex items-center justify-center"}>
        <PublicBrandingLogo size={"large"} mobile={false} />
      </div>
      <Card className={"max-w-[420px] mt-8 mx-auto"}>
        <h1 className={"text-xl text-center z-10 relative"}>
          {t("instanceSetup.welcomeTitle")}
        </h1>
        <div
          className={
            "text-sm text-neutral-500 font-light mt-2 block text-center z-10 relative dark:text-nb-gray-300"
          }
        >
          {t("instanceSetup.welcomeDescription")}
        </div>

        <form
          onSubmit={handleSubmit}
          className={"flex flex-col gap-5 mt-7 z-10 relative"}
        >
          {errors.general && <ErrorMessage error={errors.general} />}
          <div>
            <Label htmlFor={"name"}>{t("instanceSetup.nameLabel")}</Label>
            <Input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleInputChange("name")}
              placeholder={t("instanceSetup.namePlaceholder")}
              disabled={isSubmitting}
              autoFocus
              error={errors.name}
            />
          </div>

          <div>
            <Label htmlFor={"email"}>{t("instanceSetup.emailLabel")}</Label>
            <Input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange("email")}
              placeholder="admin@example.com"
              disabled={isSubmitting}
              error={errors.email}
            />
          </div>

          <div>
            <Label htmlFor={"password"}>{t("common.password")}</Label>
            <Input
              type={"password"}
              id="password"
              value={formData.password}
              onChange={handleInputChange("password")}
              placeholder={t("instanceSetup.passwordPlaceholder")}
              disabled={isSubmitting}
              error={errors.password}
              showPasswordToggle={true}
            />
            <HelpText className={"mt-2"}>
              {t("instanceSetup.passwordHelp")}
            </HelpText>
          </div>

          <Button
            type={"submit"}
            disabled={isSubmitting}
            variant={"primary"}
            className={"w-full"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                {t("instanceSetup.creatingAccount")}
              </>
            ) : (
              t("instanceSetup.createAdminAccount")
            )}
          </Button>
        </form>
      </Card>

      <div className={"flex items-center justify-center mt-6"}>
        <span
          className={
            "text-sm text-neutral-500 font-light pb-10 text-center dark:text-nb-gray-400"
          }
        >
          {t("instanceSetup.oneTimeSetup")}
        </span>
      </div>
    </div>
  );
}

const Card = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "px-6 sm:px-10 py-8 pt-6",
        "bg-white border border-neutral-200 rounded-lg relative text-neutral-950 shadow-sm dark:bg-nb-gray-940 dark:border-nb-gray-910 dark:text-nb-gray-100 dark:shadow-none",
        className,
      )}
    >
      <GradientFadedBackground />
      {children}
    </div>
  );
};

const ErrorMessage = ({ error }: { error?: string }) => {
  return (
    <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 whitespace-break-spaces my-3 text-sm dark:text-red-400 dark:bg-red-800/20 dark:border-red-800/50">
      {error}
    </div>
  );
};
