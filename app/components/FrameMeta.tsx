"use client";
import Head from "next/head";

export default function FrameMeta() {
  const BASE = "http://localhost:3000"; // Change to your app's base URL

  // Mini App embed JSON according to current spec
  const frameEmbed = {
    version: "next",
    imageUrl: `${BASE}/ogimage.png`,
    button: {
      title: "Be brave",
      action: {
        type: "launch_frame",
        name: "Skatehive",
        url: BASE,
        splashImageUrl: `${BASE}/ogimage.png`,
        splashBackgroundColor: "#000000",
      },
    },
  };

  return (
    <Head>
      {/* --- Mini App embed meta tag --- */}
      <meta name="fc:frame" content={JSON.stringify(frameEmbed)} />

      {/* --- Standard Open Graph fallbacks --- */}
      <meta property="og:title" content="Skatehive App" />
      <meta
        property="og:description"
        content="The infinity skateboard magazine"
      />
      <meta property="og:image" content={`${BASE}/ogimage.png`} />
      <meta property="og:type" content="website" />

      {/* --- Twitter Card --- */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Skatehive App" />
      <meta
        name="twitter:description"
        content="The infinity skateboard magazine"
      />
      <meta name="twitter:image" content={`${BASE}/ogimage.png`} />
    </Head>
  );
}
