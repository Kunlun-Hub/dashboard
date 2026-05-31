import { Policy } from "@/interfaces/Policy";

export const isPolicyEffectivelyEnabled = (policy: Policy): boolean => {
  const hasEnabledRule =
    policy.rules?.some((rule) => rule.enabled !== false) ?? true;

  return policy.enabled && hasEnabledRule;
};
