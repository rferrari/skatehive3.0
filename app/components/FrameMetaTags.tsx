// Server component to inject proper meta tags for Farcaster Mini App
export default function FrameMetaTags() {
  const BASE = "https://my.skatehive.app";

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
    <>
      <meta property="fc:frame" content={JSON.stringify(frameEmbed)} />
      <meta property="og:title" content="Skatehive App" />
      <meta
        property="og:description"
        content="The infinity skateboard magazine"
      />
      <meta property="og:image" content={`${BASE}/ogimage.png`} />
      <meta property="og:type" content="website" />
    </>
  );
}
