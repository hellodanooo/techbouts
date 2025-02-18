import { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Sanctioning Bodies - Muay Thai & Kickboxing",
  description:
    "Explore the top sanctioning bodies in Muay Thai and Kickboxing, including IKF, PMT, and PBSC. Learn more and get involved.",
  openGraph: {
    title: "Sanctioning Bodies - Muay Thai & Kickboxing",
    description:
      "Explore the top sanctioning bodies in Muay Thai and Kickboxing, including IKF, PMT, and PBSC. Learn more and get involved.",
    images: [
      "/logos/ikf_logo.png",
      "/logos/pmt_logo_2024_sm.png",
      "/logos/PBSC-Logo.png",
    ],
    url: "https://yourdomain.com/",
    type: "website",
  },
};

export default function Page() {
  return <PageClient />;
}
