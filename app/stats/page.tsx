// app/stats/page.tsx
import StatisticsDashboard from './DashBoard';

export default function Page() {
    return (
        <StatisticsDashboard />
    );
}

export const metadata = {
    title: "Muay Thai Stats - Top Fighters and Gyms | Point Muay Thai",
    description:
      "Discover detailed Muay Thai statistics including top fighters, leading gyms, and fight data insights. Explore trends and performance analytics.",
    keywords:
      "Muay Thai, Top Fighters, Best Gyms, Fight Stats, Point Muay Thai",
    authors: [{ name: "Techbouts Inc" }],
    robots: "index, follow",
    openGraph: {
      title: "Muay Thai Stats - Top Fighters and Gyms | Point Muay Thai",
      description:
        "Discover detailed Muay Thai statistics including top fighters, leading gyms, and fight data insights. Explore trends and performance analytics.",
      url: "https://yourdomain.com/stats",
      type: "website",
      images: [
        {
          url: "/logos/pmt_logo_2024_sm.png",
          width: 1200,
          height: 630,
          alt: "Muay Thai Logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Muay Thai Stats - Top Fighters and Gyms | Point Muay Thai",
      description:
        "Discover detailed Muay Thai statistics including top fighters, leading gyms, and fight data insights. Explore trends and performance analytics.",
      images: ["/logos/pmt_logo_2024_sm.png"],
    },
};