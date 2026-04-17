import React, { useState, useEffect, useRef, useMemo, type FC } from "react";
import {
  Box,
  Input,
  Dropdown,
  SegmentedToggle,
  Text,
  TextButton,
} from "@wix/design-system";
import { Desktop, Mobile, PreviewSmall, More } from "@wix/wix-ui-icons-common";
import { type Label } from "@/extensions/dashboard/pages/types";
import CollectionsDesktopPreview from "./previewTab/CollectionsDesktopPreview";
import CollectionsMobilePreview from "./previewTab/CollectionsMobilePreview";
import ProductDesktopPreview from "./previewTab/ProductDesktopPreview";
import ProductMobilePreview from "./previewTab/ProductMobilePreview";
import type { ProductPreview } from "@/lib/storeSdk";
import { ProductPickerModal } from "./ProductPickerModal";
import { applyLabelVariablePreviewExamples } from "@/utils/labelVariables";

type ViewMode = "collection" | "product";
type DeviceMode = "desktop" | "mobile";

export type LabelPreviewProps = {
  settings: Label;
  onNameChange: (name: string) => void;
  onEnabledChange: (enabled: boolean) => void;
};

const SEP = (
  <div
    style={{
      width: 1,
      height: 20,
      background: "#e2e2e2",
      margin: "0 12px",
      flexShrink: 0,
    }}
  />
);

const ActivePill: FC<{ enabled: boolean; onToggle: () => void }> = ({
  enabled,
  onToggle,
}) => (
  <button
    onClick={onToggle}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px 4px 8px",
      borderRadius: 20,
      border: `1.5px solid ${enabled ? "#c7edda" : "#e2e2e2"}`,
      background: enabled ? "#f0faf5" : "#f5f5f5",
      cursor: "pointer",
      transition: "all 0.18s ease",
      outline: "none",
      whiteSpace: "nowrap",
      flexShrink: 0,
    }}
  >
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: enabled ? "#00b050" : "#b0b0b0",
        flexShrink: 0,
        transition: "background 0.18s ease",
      }}
    />
    <span
      style={{
        fontSize: 12,
        fontWeight: 500,
        color: enabled ? "#1a6e3c" : "#6b6b6b",
        transition: "color 0.18s ease",
      }}
    >
      {enabled ? "Active" : "Inactive"}
    </span>
  </button>
);

const VIEW_OPTIONS = [
  { id: "collection", value: "Collection pages" },
  { id: "product", value: "Preview product" },
];

const LabelPreview: FC<LabelPreviewProps> = ({
  settings,
  onNameChange,
  onEnabledChange,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("collection");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [isNarrow, setIsNarrow] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const name = settings.name ?? "";
  const enabled = settings.enabled;

  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(
    null
  );
  const [selectedProduct, setSelectedProduct] = useState<
    ProductPreview | undefined
  >(undefined);
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  /** Preview-only: show sample numbers instead of `{{...}}` in the badge (not saved). */
  const previewSettings = useMemo((): Label => {
    const message = applyLabelVariablePreviewExamples(
      settings.text?.message ?? ""
    );
    return {
      ...settings,
      text: { ...settings.text, message },
    };
  }, [settings]);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setIsNarrow(entry.contentRect.width < 500);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const openProductPicker = () => {
    setMenuOpen(false);
    setViewMode("product");
    setProductPickerOpen(true);
  };

  const closeProductPicker = () => setProductPickerOpen(false);

  const handleProductAdd = (productSlug: string, preview: ProductPreview) => {
    setSelectedProductSlug(productSlug);
    setSelectedProduct(preview);
    setViewMode("product");
  };

  const collapsibleControls = (
    <>
      <Box style={{ width: 170 }}>
        <Dropdown
          size="small"
          border="round"
          selectedId={viewMode}
          options={VIEW_OPTIONS}
          onSelect={(option) => setViewMode(option.id as ViewMode)}
          popoverProps={{ dynamicWidth: true, width: "unset" }}
        />
      </Box>

      {SEP}

      <TextButton
        size="small"
        prefixIcon={<PreviewSmall />}
        skin="dark"
        onClick={openProductPicker}
      >
        Preview
      </TextButton>

      {SEP}

      <SegmentedToggle
        selected={deviceMode}
        onClick={(_: React.SyntheticEvent, value: string) =>
          setDeviceMode(value as DeviceMode)
        }
        size="small"
      >
        <SegmentedToggle.Icon value="desktop" tooltipText="Desktop">
          <Desktop />
        </SegmentedToggle.Icon>
        <SegmentedToggle.Icon value="mobile" tooltipText="Mobile">
          <Mobile />
        </SegmentedToggle.Icon>
      </SegmentedToggle>
    </>
  );

  const renderPreview = () => {
    if (viewMode === "collection" && deviceMode === "desktop") {
      return <CollectionsDesktopPreview settings={previewSettings} />;
    }
    if (viewMode === "collection" && deviceMode === "mobile") {
      return <CollectionsMobilePreview settings={previewSettings} />;
    }
    if (viewMode === "product" && deviceMode === "desktop") {
      return (
        <ProductDesktopPreview
          settings={previewSettings}
          productPreview={selectedProduct}
        />
      );
    }
    return (
      <ProductMobilePreview
        settings={previewSettings}
        productPreview={selectedProduct}
      />
    );
  };

  return (
    <Box
      paddingLeft="32px"
      width="100%"
      direction="vertical"
      gap="SP3"
      style={{ boxSizing: "border-box" }}
    >
      {/* Toolbar */}
      <div
        ref={toolbarRef}
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "white",
          borderRadius: 8,
          border: "1px solid #e2e2e2",
          padding: "6px 12px",
          boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
          gap: 0,
          position: "relative",
        }}
      >
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <Input
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onNameChange(e.target.value)
            }
            placeholder="Untitled label"
            border="none"
            size="small"
          />
        </div>

        {SEP}

        <ActivePill
          enabled={enabled}
          onToggle={() => onEnabledChange(!enabled)}
        />

        {isNarrow ? (
          <>
            {SEP}
            <button
              ref={moreButtonRef}
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: 6,
                border: menuOpen
                  ? "1.5px solid #116dff"
                  : "1.5px solid #e2e2e2",
                background: menuOpen ? "#f0f5ff" : "#f5f5f5",
                cursor: "pointer",
                outline: "none",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
            >
              <More />
            </button>

            {menuOpen && (
              <div
                ref={menuRef}
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  backgroundColor: "white",
                  border: "1px solid #e2e2e2",
                  borderRadius: 10,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  zIndex: 999,
                  minWidth: 220,
                }}
              >
                <Box style={{ width: "100%" }}>
                  <Dropdown
                    size="small"
                    border="round"
                    selectedId={viewMode}
                    options={VIEW_OPTIONS}
                    onSelect={(option) => {
                      setViewMode(option.id as ViewMode);
                    }}
                  />
                </Box>
                <div style={{ height: 1, background: "#f0f0f0" }} />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text size="small" secondary>
                    Device
                  </Text>
                  <SegmentedToggle
                    selected={deviceMode}
                    onClick={(_: React.SyntheticEvent, value: string) =>
                      setDeviceMode(value as DeviceMode)
                    }
                    size="small"
                  >
                    <SegmentedToggle.Icon value="desktop" tooltipText="Desktop">
                      <Desktop />
                    </SegmentedToggle.Icon>
                    <SegmentedToggle.Icon value="mobile" tooltipText="Mobile">
                      <Mobile />
                    </SegmentedToggle.Icon>
                  </SegmentedToggle>
                </div>
                <div style={{ height: 1, background: "#f0f0f0" }} />
                <TextButton
                  size="small"
                  prefixIcon={<PreviewSmall />}
                  skin="dark"
                  onClick={openProductPicker}
                >
                  Preview product
                </TextButton>
              </div>
            )}
          </>
        ) : (
          <>
            {SEP}
            {collapsibleControls}
          </>
        )}
      </div>

      <ProductPickerModal
        isOpen={productPickerOpen}
        onClose={closeProductPicker}
        onAdd={handleProductAdd}
        initialSelectedProductSlug={selectedProductSlug}
      />

      {renderPreview()}

      <Box paddingLeft="SP4" paddingRight="SP4">
        <Text size="small" secondary>
          Don&apos;t see a shape or feature you need? Tell us in the chat below.
          We build from real store feedback.
        </Text>
      </Box>
    </Box>
  );
};

export default LabelPreview;
