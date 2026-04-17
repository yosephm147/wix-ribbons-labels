import React, { type FC } from "react";
import { Box } from "@wix/design-system";

// viewBox "0 0 40 28" — all paths are in this coordinate space
const SHAPE_SVG: Record<string, React.ReactNode> = {
  rectangle: <rect x="1" y="5" width="38" height="18" />,
  circle: <ellipse cx="20" cy="14" rx="12" ry="12" />,
  starburst: (
    <path d="M20,5 Q22.44,1.74 23.44,5.68 Q26.94,3.61 26.36,7.64 Q30.39,7.06 28.32,10.56 Q32.26,11.56 29,14 Q32.26,16.44 28.32,17.44 Q30.39,20.94 26.36,20.36 Q26.94,24.39 23.44,22.32 Q22.44,26.26 20,23 Q17.56,26.26 16.56,22.32 Q13.06,24.39 13.64,20.36 Q9.61,20.94 11.68,17.44 Q7.74,16.44 11,14 Q7.74,11.56 11.68,10.56 Q9.61,7.06 13.64,7.64 Q13.06,3.61 16.56,5.68 Q17.56,1.74 20,5 Z" />
  ),
  "right-notch-flat": <path d="M1,5 L39,5 L39,23 L1,23 L9,14 Z" />,
  "left-notch-flat": <path d="M1,5 L39,5 L31,14 L39,23 L1,23 Z" />,
  "arrow-right": <path d="M1,5 L28,5 L39,14 L28,23 L1,23 Z" />,
  "arrow-left": <path d="M1,14 L9,5 L39,5 L39,23 L9,23 Z" />,
  "double-arrow": <path d="M7,5 L33,5 L39,14 L33,23 L7,23 L1,14 Z" />,
  "diagonal-slash": <path d="M0,1 L40,29 L37,17 L12,0" />,
  "diagonal-slash-flipped": <path d="M40,28 L0,0 L3,12 L28,29 Z" />,
  "corner-tr": <path d="M14,0 L40,0 L40,28 Z" />,
  "corner-tl": <path d="M0,0 L0,28 L26,28 Z" />,
  trapezoid: <path d="M1,5 L39,5 L33,23 L7,23 Z" />,
  "trapezoid-inv": <path d="M7,5 L33,5 L39,23 L1,23 Z" />,
  bowtie: <path d="M1,5 H39 L28,14 L39,23 H1 L12,14 Z" />,
  "concave-right": <path d="M1,5 H39 Q33,14 39,23 H1 Q7,14 1,23 V5 Z" />,
  "concave-left": <path d="M1,5 H39 V23 H1 Q7,14 1,5 Z" />,
  hexagon: <path d="M12,2 L28,2 L38,14 L28,26 L12,26 L2,14 Z" />,
  diamond: <path d="M20,2 L38,14 L20,26 L2,14 Z" />,
  "rounded-rectangle": <rect x="1" y="5" width="38" height="18" rx="5" />,
  ribbon: <path d="M1,5 H39 Q33,14 39,23 H1 Q7,14 1,5 Z" />,
  "wide-chevron": <path d="M1,5 H32 L39,14 L32,23 H1 L8,14 Z" />,
  "diagonal-slash-round": (
    <path d="M6.7,11.1 Q8,9 10.5,9 L35.5,9 Q38,9 36.7,11.1 L33.3,16.9 Q32,19 29.5,19 L4.5,19 Q2,19 3.3,16.9 Z" />
  ),
  "diagonal-slash-round-rotated": (
    <path d="M33.3,11.1 Q32,9 29.5,9 L4.5,9 Q2,9 3.3,11.1 L6.7,16.9 Q8,19 10.5,19 L35.5,19 Q38,19 36.7,16.9 Z" />
  ),
};

export const SHAPE_OPTIONS = Object.keys(SHAPE_SVG) as string[];

type ShapePickerProps = {
  value: string;
  onChange: (shape: string) => void;
};

const ShapeIcon: FC<{
  shapeId: string;
  selected: boolean;
  onClick: () => void;
}> = ({ shapeId, selected, onClick }) => (
  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
  <div
    onClick={onClick}
    style={{
      width: 38,
      height: 36,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 6,
      border: `2px solid ${selected ? "#116dff" : "transparent"}`,
      backgroundColor: selected ? "#e7f0ff" : "#f0f4f7",
      cursor: "pointer",
      flexShrink: 0,
      boxSizing: "border-box",
    }}
  >
    <svg
      viewBox="0 0 40 28"
      width="28"
      height="20"
      fill={selected ? "#116dff" : "#b6c1cd"}
    >
      {SHAPE_SVG[shapeId]}
    </svg>
  </div>
);

const ShapePicker: FC<ShapePickerProps> = ({ value, onChange }) => (
  <Box flexWrap="wrap" gap="SP1">
    {SHAPE_OPTIONS.map((id) => (
      <ShapeIcon
        key={id}
        shapeId={id}
        selected={value === id}
        onClick={() => onChange(id)}
      />
    ))}
  </Box>
);

export default ShapePicker;
