"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const organizations = [
  {
    name: "IKF Kickboxing & Muay Thai",
    logo: "/logos/ikf_logo.png",
    link: "https://www.ikffightsports.com/ikfkickboxingmuaythai",
    description:
      "The International Kickboxing Federation (IKF) is a worldwide governing body for Kickboxing and Muay Thai.",
  },
  {
    name: "PMT West",
    logo: "/logos/pmt_logo_2024_sm.png",
    link: "https://www.pmt-west.app/",
    description:
      "PMT West promotes Point Muay Thai events, fostering a safe and competitive environment for fighters.",
  },
  {
    name: "Point Boxing Sanctioning Commission (PBSC)",
    logo: "/logos/pbsc_logo.png",
    link: "https://www.pointboxing.com/",
    description:
      "PBSC oversees the regulation of point boxing competitions, ensuring fair and standardized rules.",
  },
];

export default function PageClient() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-6">
        Sanctioning Bodies
      </h1>
      <div className="grid md:grid-cols-3 gap-6">
        {organizations.map((org, index) => (
          <Card key={index} className="p-4 shadow-lg">
            <CardHeader>
              <div className="flex justify-center">
                <Image
                  src={org.logo}
                  alt={org.name}
                  width={150}
                  height={150}
                  className="rounded-lg"
                />
              </div>
              <CardTitle className="text-center mt-4">{org.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                {org.description}
              </p>
              <div className="flex justify-center mt-4">
                <Button asChild>
                  <a href={org.link} target="_blank" rel="noopener noreferrer">
                    Visit Website
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
