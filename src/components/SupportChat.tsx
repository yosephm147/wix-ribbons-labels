import { useEffect } from "react";

export default function SupportChat({
  merchantEmail,
  merchantName,
  instanceId,
  siteId,
  siteUrl,
  plan,
  tidioKey,
}: {
  merchantEmail: string | null;
  merchantName: string | null;
  instanceId: string;
  siteId: string;
  siteUrl: string;
  plan?: string | null;
  tidioKey: string;
}) {
  useEffect(() => {
    // inject Tidio once
    if (document.getElementById("tidio-script")) return;

    const s = document.createElement("script");
    s.src = `https://code.tidio.co/${tidioKey}.js`;
    s.async = true;
    s.id = "tidio-script";
    document.body.appendChild(s);

    // Poll for API availability
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      pollCount++;

      if (window.tidioChatApi && window.tidioChatApi.setVisitorData) {
        clearInterval(pollInterval);

        // Set Tidio identify data
        document.tidioIdentify = {
          distinct_id: siteUrl,
          email: merchantEmail || `${siteUrl}@noemail.local`,
          name: merchantName || siteUrl,
        };

        // Set visitor data with location and tags
        window.tidioChatApi?.setVisitorData({
          tags: [
            `plan: ${plan || "unknown"}`,
            `site: ${siteUrl}`,
            `instance: ${instanceId}`,
            `siteId: ${siteId}`,
          ],
        });
      } else if (pollCount >= 20) {
        clearInterval(pollInterval);
      }
    }, 500);

    return () => clearInterval(pollInterval);
  }, [
    merchantEmail,
    merchantName,
    siteUrl,
    instanceId,
    siteId,
    plan,
    tidioKey,
  ]);

  return null;
}
