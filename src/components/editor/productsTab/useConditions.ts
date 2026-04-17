import type { ConditionRule, Label } from "@/extensions/dashboard/pages/types";

export function useConditions(value: Label, onChange: (next: Label) => void) {
  const hasRule = (type: ConditionRule["type"]) =>
    value.conditions.rules.some((r) => r.type === type);

  function getRule<T extends ConditionRule["type"]>(
    type: T
  ): Extract<ConditionRule, { type: T }> | undefined {
    return value.conditions.rules.find(
      (r): r is Extract<ConditionRule, { type: T }> => r.type === type
    );
  }

  const setRules = (rules: ConditionRule[]) =>
    onChange({ ...value, conditions: { ...value.conditions, rules } });

  const addRule = (rule: ConditionRule) =>
    setRules([...value.conditions.rules, rule]);

  const removeRule = (type: ConditionRule["type"]) =>
    setRules(value.conditions.rules.filter((r) => r.type !== type));

  const updateRule = (updated: ConditionRule) =>
    setRules(
      value.conditions.rules.map((r) => (r.type === updated.type ? updated : r))
    );

  const toggleRule = (
    type: ConditionRule["type"],
    defaultRule: ConditionRule
  ) => {
    if (hasRule(type)) removeRule(type);
    else addRule(defaultRule);
  };

  return { hasRule, getRule, addRule, removeRule, updateRule, toggleRule };
}

export type ConditionHelpers = ReturnType<typeof useConditions>;
