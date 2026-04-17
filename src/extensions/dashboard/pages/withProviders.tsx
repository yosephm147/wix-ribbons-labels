import React, { createContext } from "react";
import { WixDesignSystemProvider } from "@wix/design-system";
import { i18n } from "@wix/essentials";

export const DashboardLocaleContext = createContext<string | null>(null);

export default function withProviders<P extends {} = {}>(
  Component: React.FC<P>
) {
  return function DashboardProviders(props: P) {
    const locale = i18n.getLocale();
    return (
      <DashboardLocaleContext.Provider value={locale}>
        <WixDesignSystemProvider
          locale={"locale"}
          features={{ newColorsBranding: true }}
        >
          <Component {...props} />
        </WixDesignSystemProvider>
      </DashboardLocaleContext.Provider>
    );
  };
}

export { withProviders };
