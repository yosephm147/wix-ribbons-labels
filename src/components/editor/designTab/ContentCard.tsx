import React, { type FC, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Card,
  Collapse,
  Dropdown,
  Popover,
  FormField,
  IconButton,
  PopoverMenu,
  TextButton,
  Text,
  ColorPicker,
} from "@wix/design-system";
import {
  Bold,
  ChevronDown,
  ChevronUp,
  Italic,
  TextAlignCenter,
  TextAlignLeft,
  TextAlignRight,
  Underline,
} from "@wix/wix-ui-icons-common/classic-editor";
import type { Label } from "@/extensions/dashboard/pages/types";
import {
  labelFontCssStack,
  labelFontDropdownOptions,
  normalizeLabelFontId,
  THEME_FONT_DROPDOWN_ID,
} from "@/utils/labelFonts";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { messageUsesAnyLabelVariable } from "@/utils/labelVariables";

const VARIABLE_OPTIONS = [
  {
    id: "sale_amt",
    value: "Sale amount ($)",
    description: "The exact sale amount",
  },
  {
    id: "sale_pct",
    value: "Sale percentage (%)",
    description: "The discount percentage off",
  },
  {
    id: "inventory_quantity",
    value: "Inventory quantity",
    description: "The current inventory quantity",
  },
  {
    id: "min_price",
    value: "Min price",
    description: "The lowest price of the product",
  },
];

type ActiveFormats = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right";
};

export type ContentCardProps = {
  value: Label;
  onChange: (next: Label) => void;
};

const SmileyIcon: FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="10" x2="9.01" y2="10" />
    <line x1="15" y1="10" x2="15.01" y2="10" />
  </svg>
);

function placeCaretAtEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

const ContentCard: FC<ContentCardProps> = ({
  value,
  onChange,
}: ContentCardProps) => {
  const [open, setOpen] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastSyncedMessage = useRef<string>("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [textPickerOpen, setTextPickerOpen] = useState(false);
  const textColor = value.text.color || "";
  const fontDropdownOptions = useMemo(() => labelFontDropdownOptions(), []);
  const hasSaleVariable = useMemo(() => {
    const message = value.text.message || "";
    return message.includes("{{sale_amt}}") || message.includes("{{sale_pct}}");
  }, [value.text.message]);
  const hasInventoryQuantityVariable = useMemo(() => {
    const message = value.text.message || "";
    return message.includes("{{inventory_quantity}}");
  }, [value.text.message]);

  const [activeFormats, setActiveFormats] = useState<ActiveFormats>({
    bold: false,
    italic: false,
    underline: false,
    align: "center",
  });

  const updateFormats = () => {
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;

    const node = selection.anchorNode;
    const el =
      node.nodeType === Node.ELEMENT_NODE
        ? (node as Element)
        : node.parentElement;
    if (!el) return;

    const style = window.getComputedStyle(el);
    const weight = style.fontWeight;
    const align = style.textAlign;

    setActiveFormats({
      bold: weight === "bold" || parseInt(weight) >= 700,
      italic: style.fontStyle === "italic" || style.fontStyle === "oblique",
      underline: style.textDecoration.includes("underline"),
      align: align === "right" ? "right" : align === "left" ? "left" : "center",
    });
  };

  const notifyChange = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastSyncedMessage.current = html;
      onChange({ ...value, text: { ...value.text, message: html } });
    }
  };

  const captureEditorSelection = () => {
    const ed = editorRef.current;
    const sel = window.getSelection();
    if (!ed || !sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (ed.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  };

  const restoreEditorSelectionOrEnd = () => {
    const ed = editorRef.current;
    if (!ed) return;
    ed.focus();
    const sel = window.getSelection();
    const saved = savedRangeRef.current;
    if (saved) {
      try {
        if (ed.contains(saved.commonAncestorContainer)) {
          sel?.removeAllRanges();
          sel?.addRange(saved);
          return;
        }
      } catch {
        /* detached range */
      }
    }
    placeCaretAtEnd(ed);
  };

  useEffect(() => {
    const onSelectionChange = () => captureEditorSelection();
    document.addEventListener("selectionchange", onSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  const execFormat = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, undefined);
    updateFormats();
    notifyChange();
  };

  const insertVariable = (variableId: string) => {
    restoreEditorSelectionOrEnd();
    document.execCommand("insertText", false, `{{${variableId}}}`);
    captureEditorSelection();
    notifyChange();
  };

  const insertEmoji = (emoji: string) => {
    restoreEditorSelectionOrEnd();
    document.execCommand("insertText", false, emoji);
    captureEditorSelection();
    notifyChange();
  };

  // Sync external message changes (e.g. switching labels) but not our own edits
  useEffect(() => {
    const el = editorRef.current;
    if (el && value.text.message !== lastSyncedMessage.current) {
      el.innerHTML = value.text.message || "";
      lastSyncedMessage.current = value.text.message;
    }
  }, [value.text.message]);

  return (
    <Card>
      <Card.Header
        title="Content"
        suffix={
          <IconButton
            size="large"
            priority="tertiary"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <ChevronUp /> : <ChevronDown />}
          </IconButton>
        }
      />
      <Collapse open={open}>
        <Card.Divider />
        <Card.Content>
          <Box direction="vertical" gap="SP4">
            <Popover
              shown={textPickerOpen}
              onClickOutside={() => setTextPickerOpen(false)}
              placement="bottom-start"
              appendTo="window"
            >
              <Popover.Element>
                <div
                  onClick={() => setTextPickerOpen((prev) => !prev)}
                  style={{ cursor: "pointer" }}
                >
                  <Box direction="horizontal" verticalAlign="middle" gap="SP3">
                    <Box
                      width="36px"
                      height="36px"
                      borderRadius="50%"
                      flexShrink="0"
                      style={{
                        backgroundColor: textColor || "transparent",
                        border: "1px solid #dfe3eb",
                      }}
                    />
                    <Box direction="vertical" gap="SP0">
                      <Text weight="bold" size="small">
                        Text color
                      </Text>
                      <Text secondary size="small">
                        {textColor || "transparent"}
                      </Text>
                    </Box>
                  </Box>
                </div>
              </Popover.Element>
              <Popover.Content>
                <ColorPicker
                  value={textColor || ""}
                  onConfirm={(color: any) => {
                    onChange({
                      ...value,
                      text: {
                        ...value.text,
                        color: color ? color.hex?.() ?? color : "#000000",
                      },
                    });
                    setTextPickerOpen(false);
                  }}
                />
              </Popover.Content>
            </Popover>
            <FormField label="Font">
              <Dropdown
                options={fontDropdownOptions}
                selectedId={normalizeLabelFontId(value.text.font)}
                allowTextSelection={false}
                onSelect={({ id }) => {
                  const sid = String(id);
                  onChange({
                    ...value,
                    text: {
                      ...value.text,
                      font: sid === THEME_FONT_DROPDOWN_ID ? undefined : sid,
                    },
                  });
                }}
                dropdownWidth="100%"
                popoverProps={{
                  dynamicWidth: true,
                  width: "unset",
                  minWidth: "unset",
                }}
              />
            </FormField>
            <FormField label="Message">
              <Box
                direction="vertical"
                border="1px solid #dfe3eb"
                borderRadius="8px"
              >
                {/* Toolbar */}
                <Box
                  direction="horizontal"
                  verticalAlign="middle"
                  gap="SP1"
                  padding="SP1"
                  backgroundColor="D70"
                  style={
                    { borderBottom: "1px solid #dfe3eb" } as React.CSSProperties
                  }
                >
                  <IconButton
                    skin={activeFormats.bold ? "standard" : "inverted"}
                    size="small"
                    onClick={() => execFormat("bold")}
                    ariaLabel="Bold"
                  >
                    <Bold />
                  </IconButton>
                  <IconButton
                    skin={activeFormats.italic ? "standard" : "inverted"}
                    size="small"
                    onClick={() => execFormat("italic")}
                    ariaLabel="Italic"
                  >
                    <Italic />
                  </IconButton>
                  <IconButton
                    skin={activeFormats.underline ? "standard" : "inverted"}
                    size="small"
                    onClick={() => execFormat("underline")}
                    ariaLabel="Underline"
                  >
                    <Underline />
                  </IconButton>
                  <IconButton
                    skin="inverted"
                    size="small"
                    onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    ariaLabel="Insert emoji"
                  >
                    <SmileyIcon />
                  </IconButton>

                  <Box
                    width="1px"
                    height="16px"
                    style={
                      {
                        backgroundColor: "#dfe3eb",
                        flexShrink: 0,
                        margin: "0 2px",
                      } as React.CSSProperties
                    }
                  />

                  <IconButton
                    skin={
                      activeFormats.align === "left" ? "standard" : "inverted"
                    }
                    size="small"
                    onClick={() => execFormat("justifyLeft")}
                    ariaLabel="Align left"
                  >
                    <TextAlignLeft />
                  </IconButton>
                  <IconButton
                    skin={
                      activeFormats.align === "center" ? "standard" : "inverted"
                    }
                    size="small"
                    onClick={() => execFormat("justifyCenter")}
                    ariaLabel="Align center"
                  >
                    <TextAlignCenter />
                  </IconButton>
                  <IconButton
                    skin={
                      activeFormats.align === "right" ? "standard" : "inverted"
                    }
                    size="small"
                    onClick={() => execFormat("justifyRight")}
                    ariaLabel="Align right"
                  >
                    <TextAlignRight />
                  </IconButton>

                  <Box flexGrow={1} />

                  <PopoverMenu
                    placement="bottom-end"
                    textSize="small"
                    triggerElement={
                      <TextButton size="small" suffixIcon={<ChevronDown />}>
                        Add variable
                      </TextButton>
                    }
                  >
                    {VARIABLE_OPTIONS.map((opt) => (
                      <PopoverMenu.MenuItem
                        key={opt.id}
                        text={opt.value}
                        onClick={() => insertVariable(opt.id)}
                      />
                    ))}
                  </PopoverMenu>
                </Box>

                {/* Editable text area */}
                <Box padding="SP3" position="relative">
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() => {
                      captureEditorSelection();
                      notifyChange();
                    }}
                    onKeyUp={() => {
                      captureEditorSelection();
                      updateFormats();
                    }}
                    onMouseUp={() => {
                      captureEditorSelection();
                      updateFormats();
                    }}
                    style={{
                      fontFamily: labelFontCssStack(value.text.font),
                      width: "100%",
                      minHeight: "80px",
                      outline: "none",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      cursor: "text",
                      wordBreak: "break-word",
                      textAlign: activeFormats.align,
                    }}
                  />
                  {showEmojiPicker && (
                    <Box
                      position="absolute"
                      zIndex={10}
                      style={{ top: 0, left: 0 }}
                    >
                      <EmojiPicker
                        onEmojiClick={(emojiData: EmojiClickData) => {
                          insertEmoji(emojiData.emoji);
                          setShowEmojiPicker(false);
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Box>
            </FormField>
            {hasSaleVariable && (
              <Text size="small" secondary>
                Note: This label will only appear on items that have a sale.
              </Text>
            )}
            {hasInventoryQuantityVariable && (
              <Text size="small" secondary>
                Note: This label will only appear on items that track inventory.
              </Text>
            )}
          </Box>
        </Card.Content>
      </Collapse>
    </Card>
  );
};

export default ContentCard;
