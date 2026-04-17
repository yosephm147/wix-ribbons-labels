import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Input, Text } from "@wix/design-system";

export type Option = { id: string; label: string; slug: string };

const DEBOUNCE_MS = 300;

export function AsyncMultiSelect({
  value,
  onChange,
  fetchOptions,
  placeholder,
}: {
  value: Option[];
  onChange: (v: Option[]) => void;
  fetchOptions: (input: string) => Promise<Option[]>;
  placeholder: string;
}) {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      setLoading(true);
      fetchOptions(input)
        .then((results) => {
          setOptions(results);
        })
        .catch(() => setOptions([]))
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [input, open, fetchOptions]);

  const addOption = useCallback(
    (opt: Option) => {
      if (value.some((v) => v.id === opt.id)) return;
      onChange([...value, opt]);
    },
    [value, onChange]
  );

  const removeOption = useCallback(
    (id: string) => {
      onChange(value.filter((x) => x.id !== id));
    },
    [value, onChange]
  );

  return (
    <div ref={containerRef}>
      <Box direction="vertical" gap="SP2">
        <Input
          value={input}
          placeholder={placeholder}
          onChange={(e) => {
            setInput((e.target as HTMLInputElement).value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {open && (
          <Box
            direction="vertical"
            gap="SP0"
            style={{
              border: "1px solid var(--color-border-primary, #e5e7eb)",
              borderRadius: "8px",
              boxShadow:
                "0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
              background: "var(--color-background-primary, #fff)",
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                overflowY: "auto",
                overflowX: "hidden",
                maxHeight: "150px",
                minHeight: 0,
                scrollBehavior: "smooth",
              }}
            >
              {loading && options.length === 0 && (
                <Box padding="SP2">
                  <Text size="tiny">Loading...</Text>
                </Box>
              )}
              {!loading && options.length === 0 && input.trim() && (
                <Box padding="SP2">
                  <Text size="tiny" secondary>
                    No results
                  </Text>
                </Box>
              )}
              {options.length > 0 &&
                options.map((o) => {
                  const isSelected = value.some((v) => v.id === o.id);
                  return (
                    <div
                      key={o.id}
                      onClick={() => addOption(o)}
                      onMouseDown={(e) => e.preventDefault()}
                      style={{
                        padding: "10px 12px",
                        cursor: "pointer",
                        background: isSelected ? "#eef2ff" : "transparent",
                        transition: "background-color 0.12s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected)
                          e.currentTarget.style.backgroundColor = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected)
                          e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Text size="small">{o.label}</Text>
                    </div>
                  );
                })}
            </div>
          </Box>
        )}
        <Box
          direction="horizontal"
          style={{
            marginTop: 8,
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {value.map((v) => (
            <Box
              key={v.id}
              align="center"
              gap="SP0"
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: "8px",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                transition:
                  "background-color 0.12s ease, border-color 0.12s ease",
              }}
              padding="6px 10px 6px 12px"
            >
              <Text size="tiny">{v.label}</Text>
              <button
                type="button"
                onClick={() => removeOption(v.id)}
                aria-label={`Remove ${v.label}`}
                style={{
                  marginLeft: 6,
                  padding: 2,
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  borderRadius: 4,
                  color: "#64748b",
                  fontSize: 16,
                  lineHeight: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "color 0.12s ease, background-color 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#0f172a";
                  e.currentTarget.style.backgroundColor = "#e2e8f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#64748b";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                ×
              </button>
            </Box>
          ))}
        </Box>
      </Box>
    </div>
  );
}
