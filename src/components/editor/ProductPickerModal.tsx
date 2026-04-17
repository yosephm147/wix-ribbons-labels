import React, { useState, useEffect, useCallback, type FC } from "react";
import { Input, Image, Text } from "@wix/design-system";
import {
  searchProductsByName,
  getProductPreview,
  type ProductPreview,
  type SearchOption,
} from "@/lib/storeSdk";

const DEBOUNCE_MS = 300;

export type ProductPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (productSlug: string, preview: ProductPreview) => void;
  initialSelectedProductSlug?: string | null;
};

export const ProductPickerModal: FC<ProductPickerModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  initialSelectedProductSlug = null,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [draftSelectedSlug, setDraftSelectedSlug] = useState<string | null>(
    initialSelectedProductSlug ?? null
  );
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => {
    setDraftSelectedSlug(initialSelectedProductSlug ?? null);
  }, [initialSelectedProductSlug, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      (async () => {
        setLoading(true);
        try {
          // Empty query = show first 20 products
          const list = await searchProductsByName(query.trim());
          if (cancelled) return;
          setResults(list);
        } catch {
          if (cancelled) return;
          setResults([]);
        } finally {
          if (cancelled) return;
          setLoading(false);
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [isOpen, query]);

  const handleAdd = useCallback(async () => {
    if (!draftSelectedSlug || applyLoading) return;
    setApplyLoading(true);
    try {
      const preview = await getProductPreview(draftSelectedSlug);
      onAdd(draftSelectedSlug, preview);
      onClose();
    } finally {
      setApplyLoading(false);
    }
  }, [draftSelectedSlug, applyLoading, onAdd, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-picker-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.4)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 620,
          height: 750,
          background: "#fff",
          borderRadius: 20,
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <Text id="product-picker-title" size="medium" weight="bold">
            Add product
          </Text>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: "none",
              background: "#f1f5f9",
              cursor: "pointer",
              color: "#64748b",
              fontSize: 20,
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e2e8f0";
              e.currentTarget.style.color = "#334155";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div
          style={{
            padding: "16px 24px",
            flexShrink: 0,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Input
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setQuery(e.target.value)
            }
            placeholder="Search products"
            size="small"
            border="standard"
          />
        </div>

        {/* Results */}
        <div
          style={{
            padding: "0 24px 20px",
            overflowY: "auto",
            flex: 1,
            minHeight: 280,
          }}
        >
          {loading && results.length === 0 ? (
            <div
              style={{
                padding: "32px 0",
                textAlign: "center",
                color: "#64748b",
                fontSize: 14,
              }}
            >
              Loading…
            </div>
          ) : results.length === 0 ? (
            <div
              style={{
                padding: "32px 0",
                textAlign: "center",
                color: "#64748b",
                fontSize: 14,
              }}
            >
              No results
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {results.map((p) => {
                const active = p.slug === draftSelectedSlug;
                return (
                  <div
                    key={p.slug}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDraftSelectedSlug(p.slug)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setDraftSelectedSlug(p.slug);
                      }
                    }}
                    style={{
                      padding: "14px 18px",
                      borderRadius: 12,
                      cursor: "pointer",
                      background: active ? "#eff6ff" : "#fafafa",
                      border: `1.5px solid ${active ? "#3b82f6" : "#e5e7eb"}`,
                      boxShadow: active
                        ? "0 0 0 1px rgba(59, 130, 246, 0.2)"
                        : "none",
                      transition: "all 0.15s ease",
                      outline: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "#f4f4f5";
                        e.currentTarget.style.borderColor = "#d4d4d8";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "#fafafa";
                        e.currentTarget.style.borderColor = "#e5e7eb";
                      }
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      <Image
                        src={p.imageUrl}
                        width={44}
                        height={44}
                        fit="cover"
                        transparent={true}
                      />
                    </div>
                    <Text size="small" weight={active ? "bold" : "normal"}>
                      {p.label}
                    </Text>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px 20px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "#fff",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              color: "#64748b",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.color = "#475569";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!draftSelectedSlug || applyLoading}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              background:
                !draftSelectedSlug || applyLoading ? "#cbd5e1" : "#3b82f6",
              cursor:
                !draftSelectedSlug || applyLoading ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              opacity: !draftSelectedSlug || applyLoading ? 0.8 : 1,
              transition: "background 0.15s, opacity 0.15s",
            }}
            onMouseEnter={(e) => {
              if (draftSelectedSlug && !applyLoading) {
                e.currentTarget.style.background = "#2563eb";
              }
            }}
            onMouseLeave={(e) => {
              if (draftSelectedSlug && !applyLoading) {
                e.currentTarget.style.background = "#3b82f6";
              }
            }}
          >
            {applyLoading ? "Adding…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPickerModal;
