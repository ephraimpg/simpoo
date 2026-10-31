import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mainflow-school.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    { path: "", priority: "1.0" },
    { path: "/about", priority: "0.8" },
    { path: "/academics", priority: "0.8" },
    { path: "/admissions", priority: "0.9" },
    { path: "/school-life", priority: "0.7" },
    { path: "/gallery", priority: "0.7" },
    { path: "/contact", priority: "0.8" },
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: Number(route.priority),
  }));
}
