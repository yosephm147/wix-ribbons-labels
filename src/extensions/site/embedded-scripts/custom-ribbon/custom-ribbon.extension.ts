import { extensions } from "@wix/astro/builders";

export default extensions.embeddedScript({
  id: "e8ce6d3d-fa58-4afd-9aab-3061ed927320",
  name: "Custom Ribbon",
  placement: "BODY_END",
  scriptType: "FUNCTIONAL",
  source: "./extensions/site/embedded-scripts/custom-ribbon/custom-ribbon.html",
});
