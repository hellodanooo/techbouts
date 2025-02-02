'use client';

import React, { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface Fighter {
  first: string;
  last: string;
  gym: string;
  coach: string;
  coach_phone: string;
  opponent_name: string;
  result: string;
  city: string;
  state: string;
  dob: string;
  fighter_id: string;
}

interface Event {
  event_name: string;
  date: string;
  sanctioning: string;
  promotion: string;
  location: string;
  fighters: Fighter[];
}

interface ScrapeResult {
  status: string;
  data: {
    events: Record<number, Event>;
    rawContent: string;
    images: Array<{ src: string; alt: string }>;
  };
}

export default function PageContent() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleScrape = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/scrape/ikf_legacy', {
        headers: {
          'x-url': 'http://www.ikfkickboxing.com/News2020Feb.htm'
        }
      });
      const data = await response.json();

      const events: Record<number, Event> = {};
      const eventIndex = 0;
      let rawContent = '';
      const images = data.data.images || [];

      data.data.content.forEach((item: { type: string; content: string }) => {
        rawContent += `\n${item.content}`;
        if (item.type === 'p' && item.content.includes('Results')) {
          events[eventIndex] = {
            event_name: item.content,
            date: '',
            sanctioning: '',
            promotion: '',
            location: '',
            fighters: []
          };
        } else if (item.type === 'li') {
          const fightDetails = item.content.match(/(\w+)\s(\w+)\s\(([^)]+)\)\sVS\s(\w+)\s(\w+)\s\(([^)]+)\)/);
          if (fightDetails) {
            const [, first, last, gym, opponentFirst, opponentLast] = fightDetails; // Removed `_` and `opponentGym`
            const dob = 'mmddyyyy';
            events[eventIndex]?.fighters.push({
              first,
              last,
              gym,
              coach: '',
              coach_phone: '',
              opponent_name: `${opponentFirst} ${opponentLast}`,
              result: '',
              city: '',
              state: '',
              dob,
              fighter_id: `${first}${last}${dob}`
            });
          }
        }
      });

      setScrapeResult({
        status: 'success',
        data: { events, rawContent, images }
      });
      setIsOpen(true);
    } catch (error) {
      console.error('Error:', error);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleScrape} disabled={isLoading} className="w-full md:w-auto">
        {isLoading ? 'Scraping...' : 'Scrape IKF Legacy Content'}
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Scraped Content</AlertDialogTitle>
          </AlertDialogHeader>

          {scrapeResult && (
            <div className="space-y-4 p-4">
              <div className="font-semibold">JSON Event Data:</div>
              <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-4 rounded">
                {JSON.stringify(scrapeResult.data.events, null, 2)}
              </pre>

              <div className="font-semibold">Raw Scraped Data:</div>
              <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-4 rounded">
                {scrapeResult.data.rawContent}
              </pre>

              <div className="font-semibold">Extracted Images:</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {scrapeResult.data.images.map((image, index) => (
                  <img key={index} src={image.src} alt={image.alt} className="w-full h-auto rounded-lg shadow-md" />
                ))}
              </div>
            </div>
          )}

          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}