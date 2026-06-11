import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Anteiku",
    short_name: "Anteiku",
    description: "Daily stock and waste logging for café teams on shift.",
    start_url: "/dashboard/floor",
    display: "standalone",
    background_color: "#0f1713",
    theme_color: "#0f1713",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
