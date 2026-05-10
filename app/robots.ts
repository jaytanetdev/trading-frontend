import { MetadataRoute } from "next";

const BASE_URL = "https://stock-analysis.techhousesoft.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/watchlist"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
