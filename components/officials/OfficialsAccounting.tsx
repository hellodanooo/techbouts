// components/officials/OfficialsAccounting.tsx
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Official } from '@/utils/types';
import html2canvas from 'html2canvas';
import { fetchPmtResults } from '@/utils/apiFunctions/fetchPmtResults';


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,

} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Printer, DollarSign } from "lucide-react"
import OfficialInvoice from './OfficialInvoice';


interface OfficialsAccountingProps {
  officials: Official[];
  eventId: string;
  promoterId: string;
  eventAddress?: string;
  eventName?: string;
  eventDate?: string;
  numMats: number;
  sanctioning: string;
  onClose: () => void;
  isOpen: boolean;
}

interface OfficialStats {
  amountJudged: number;
  amountReffed: number;
}

const OfficialsAccounting: React.FC<OfficialsAccountingProps> = ({
  officials,
  eventAddress = '',
  eventName = '',
  eventDate = '',
  numMats,
  onClose,
  isOpen,
  sanctioning,
  eventId,
}) => {
  // State variables
  const [athleteCount, setAthleteCount] = useState<{ [mat: number]: number }>({});
  const [officialsPositions, setOfficialsPositions] = useState<{ [mat: string]: Official[] }>({});
  const [distances, setDistances] = useState<{ [id: string]: number }>({});
  const [totalPay, setTotalPay] = useState<number>(0);
  const [totalRepresentativePay, setTotalRepresentativePay] = useState<number>(0);
  const [officialStats, setOfficialStats] = useState<{ [id: string]: OfficialStats }>({});
  const [uniquePmtFighterCount, setUniquePmtFighterCount] = useState<number>(0);

  // State variables for pay rates
  const [refereePay, setRefereePay] = useState<number>(9);
  const [judgePay, setJudgePay] = useState<number>(5);
  const [representativePay, setRepresentativePay] = useState<number>(7);

  // State variables for the popup
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [selectedOfficial, setSelectedOfficial] = useState<Official | null>(null);

  // Initialize athlete count for each mat
  useEffect(() => {
    const initialAthleteCount: { [mat: number]: number } = {};
    for (let i = 1; i <= numMats; i++) {
      initialAthleteCount[i] = 20; // Default to 20 athletes per mat (10 bouts)
    }
    setAthleteCount(initialAthleteCount);
  }, [numMats]);

  // Process officials and organize by mat and position
  useEffect(() => {
    if (!officials || officials.length === 0) return;

    const positions: { [mat: string]: Official[] } = {};
    officials.forEach(official => {
      // Ensure mat is treated as a string to avoid undefined index issues
      const matKey = official.mat?.toString() || "unassigned";
      if (!positions[matKey]) {
        positions[matKey] = [];
      }
      positions[matKey].push(official);
    });


    // Sort officials by location for each mat
    Object.keys(positions).forEach(mat => {
      positions[mat].sort((a: Official, b: Official) => {
        const order = ['referee', 'judge1', 'judge2', 'judge3'];
        const locA = a.location || '';
        const locB = b.location || '';
        return order.indexOf(locA) - order.indexOf(locB);
      });
    });

    setOfficialsPositions(positions);

    // Set default distances for officials (30 miles)
    const defaultDistances: { [id: string]: number } = {};
    officials.forEach(official => {
      if (official.id) {
        defaultDistances[official.id] = 5;
      }
    });
    setDistances(defaultDistances);
  }, [officials]);



  useEffect(() => {
    const getResults = async () => {
      if (sanctioning === 'PMT' && eventId) {
        const { uniqueFighterCount } = await fetchPmtResults(eventId);
        setUniquePmtFighterCount(uniqueFighterCount);
      }
    };
  
    getResults();
  }, [sanctioning, eventId]);


  // Define calculateTotalPay using useCallback to properly memoize it
  const calculateTotalPay = useCallback(() => {
    if (!officials || officials.length === 0) {
      setTotalPay(0);
      setTotalRepresentativePay(0);
      return;
    }

    const calculatedTotalFighters =
    sanctioning === 'PMT'
      ? uniquePmtFighterCount
      : Object.values(athleteCount).reduce((sum, count) => sum + count, 0);
  

    let total = 0;
    let totalRepPay = 0;

    officials.forEach(official => {
      if (!official.id) return;

      if (official.position === 'Representative') {
        const travelPay = distances[official.id] ? distances[official.id] * 0.55 : 0;
        const totalRepPayForOfficial = (calculatedTotalFighters * representativePay) + travelPay;
        totalRepPay += totalRepPayForOfficial;
      } else {
        const stats = officialStats[official.id] || { amountJudged: 0, amountReffed: 0 };
        const judgePayout = stats.amountJudged * judgePay;
        const refereePayout = stats.amountReffed * refereePay;
        const travelPay = distances[official.id] ? distances[official.id] * 0.55 : 0;
        total += judgePayout + refereePayout + travelPay;
      }
    });

    setTotalPay(total);
    setTotalRepresentativePay(totalRepPay);
  }, [officials, distances, athleteCount, refereePay, judgePay, representativePay, officialStats]);

  // Calculate total pay whenever relevant values change
  useEffect(() => {
    calculateTotalPay();
  }, [calculateTotalPay]); // Now calculateTotalPay is properly included in the dependency array

  const formatInvoiceText = (official: Official, officialStats: { [id: string]: OfficialStats }, eventName: string, eventDate: string) => {
    if (!official || !official.id) return '';

    const calculatedTotalFighters =
    sanctioning === 'PMT'
      ? uniquePmtFighterCount
      : Object.values(athleteCount).reduce((sum, count) => sum + count, 0);
  

      let invoiceText = `Point Muay Thai West
${eventName || 'Event'}
${eventDate || 'Date'}
${official.first || ''} ${official.last || ''}
${official.city || ''}, ${official.state || ''}
`;

    if (official.position === 'Representative') {
      invoiceText += `
Pay Per Fighter: $${representativePay.toFixed(2)}
Number of Fighters: ${calculatedTotalFighters}
Pay: $${(calculatedTotalFighters * representativePay).toFixed(2)}`;
    } else {
      const stats = officialStats[official.id] || { amountJudged: 0, amountReffed: 0 };

      if (stats.amountJudged > 0) {
        invoiceText += `
$${judgePay.toFixed(2)} per bout
Bouts Judged: ${stats.amountJudged}
Judge Pay: $${(stats.amountJudged * judgePay).toFixed(2)}`;
      }

      if (stats.amountReffed > 0) {
        invoiceText += `
$${refereePay.toFixed(2)} per bout
Bouts Reffed: ${stats.amountReffed}
Referee Pay: $${(stats.amountReffed * refereePay).toFixed(2)}`;
      }
    }

    if (official.id && distances[official.id]) {
      const travelPay = distances[official.id] * 0.55;
      invoiceText += `
Travel Details:
City: ${official.city || ''}, ${official.state || ''}
Distance: ${distances[official.id].toFixed(2)} miles
Travel Pay: $${travelPay.toFixed(2)}`;
    }

    const totalPay = official.position === 'Representative'
      ? ((calculatedTotalFighters * representativePay) + ((official.id && distances[official.id]) ? distances[official.id] * 0.55 : 0))
      : (
        ((official.id && officialStats[official.id]?.amountJudged) ? officialStats[official.id].amountJudged * judgePay : 0) +
        ((official.id && officialStats[official.id]?.amountReffed) ? officialStats[official.id].amountReffed * refereePay : 0) +
        ((official.id && distances[official.id]) ? distances[official.id] * 0.55 : 0)
      );

    invoiceText += `
Total: $${totalPay.toFixed(2)}`;

    return invoiceText;
  };

  const copyInvoiceToClipboard = () => {
    if (!selectedOfficial || !selectedOfficial.id) return;

    const invoiceText = formatInvoiceText(selectedOfficial, officialStats, eventName, eventDate);

    navigator.clipboard.writeText(invoiceText).then(() => {
      alert('Invoice copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy invoice:', err);
      alert('Failed to copy invoice to clipboard');
    });
  };

  const captureScreenshot = async () => {
    const element = document.querySelector('.makeAImageOfthis');
    if (element) {
      const htmlElement = element as HTMLElement;
      const originalHeight = htmlElement.style.height;
      const originalOverflow = htmlElement.style.overflow;

      htmlElement.style.height = `${htmlElement.scrollHeight}px`;
      htmlElement.style.overflow = 'visible';

      const canvas = await html2canvas(htmlElement, {
        useCORS: true,
        windowWidth: htmlElement.scrollWidth,
        windowHeight: htmlElement.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');

      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${eventName || 'officials'}_accounting.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      htmlElement.style.height = originalHeight;
      htmlElement.style.overflow = originalOverflow;
    }
  };

  const handleOfficialClick = (official: Official) => {
    if (!official) return;
    setSelectedOfficial(official);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedOfficial(null);
  };

  const updateOfficialDistance = (officialId: string, distance: number) => {
    if (!officialId) return;
    setDistances(prev => ({
      ...prev,
      [officialId]: distance
    }));
  };

  const updateOfficialStats = (officialId: string, newStats: OfficialStats) => {
    if (!officialId) return;
    setOfficialStats(prevStats => ({
      ...prevStats,
      [officialId]: newStats
    }));
  };

  const calculatedTotalFighters =
  sanctioning === 'PMT'
    ? uniquePmtFighterCount
    : Object.values(athleteCount).reduce((sum, count) => sum + count, 0);


  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>

      <SheetContent side="right" className="w-full sm:max-w-full p-0 bg-background">

        <div className="makeAImageOfthis h-full flex flex-col bg-background">
          <SheetHeader className="p-6 border-b bg-white">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-bold">Officials Accounting</SheetTitle>

            </div>
            {eventName && <p className="text-muted-foreground">{eventName}</p>}
            {eventDate && <p className="text-muted-foreground">{eventDate}</p>}
            {eventAddress && <p className="text-muted-foreground">{eventAddress}</p>}
            <p>Sanctionining: {sanctioning}</p>
          </SheetHeader>

          <ScrollArea className="flex-1 p-6">
            {/* Event Configuration Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Event Configuration</CardTitle>
                <CardDescription>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{numMats} Mats</Badge>
                    <Badge variant="outline">{calculatedTotalFighters} Athletes</Badge>
                    <Badge variant="outline">{Math.floor(calculatedTotalFighters / 2)} Bouts</Badge>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Athletes Per Mat</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(athleteCount).map(([mat, count]) => (
                        <div key={mat} className="flex items-center gap-2">
                          <Label htmlFor={`mat-${mat}`}>Mat {mat}:</Label>
                          <Input
                            id={`mat-${mat}`}
                            type="number"
                            value={count}
                            onChange={(e) => setAthleteCount(prev => ({
                              ...prev,
                              [mat]: parseInt(e.target.value) || 0
                            }))}
                            className="w-16 h-8 text-center"
                          />
                          <span className="text-sm text-muted-foreground">({Math.floor(count / 2)} bouts)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pay Rates Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Pay Rates</CardTitle>
                <CardDescription>Set payment rates for different officials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="refereePay">Referee (per bout)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="refereePay"
                        type="number"
                        value={refereePay}
                        onChange={(e) => setRefereePay(parseFloat(e.target.value) || 0)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="judgePay">Judge (per bout)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="judgePay"
                        type="number"
                        value={judgePay}
                        onChange={(e) => setJudgePay(parseFloat(e.target.value) || 0)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="representativePay">Representative (per fighter)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="representativePay"
                        type="number"
                        value={representativePay}
                        onChange={(e) => setRepresentativePay(parseFloat(e.target.value) || 0)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Representatives Table */}
            {officials.some(o => o.position === 'Representative' && o.id) && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Representatives</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Fighters</TableHead>
                        <TableHead>Pay</TableHead>
                        <TableHead>Distance (miles)</TableHead>
                        <TableHead>Travel Pay</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {officials
                        .filter(o => o.position === 'Representative' && o.id)
                        .map(official => {
                          const travelPay = official.id && distances[official.id] ? distances[official.id] * 0.55 : 0;
                          const totalRepresentativePay = (calculatedTotalFighters * representativePay) + travelPay;

                          return (
                            <TableRow
                              key={official.id}
                              className="cursor-pointer"
                              onClick={() => handleOfficialClick(official)}
                            >
                              <TableCell className="font-medium">
                                {official.first || 'N/A'} {official.last || 'N/A'}
                              </TableCell>
                              <TableCell>${representativePay.toFixed(2)}</TableCell>
                              <TableCell>{calculatedTotalFighters}</TableCell>
                              <TableCell>${(calculatedTotalFighters * representativePay).toFixed(2)}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={official.id && distances[official.id] ? distances[official.id] : 0}
                                  onChange={(e) => {
                                    if (official.id) {
                                      updateOfficialDistance(official.id, parseFloat(e.target.value) || 0);
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-20 h-8 text-center"
                                />
                              </TableCell>
                              <TableCell>${travelPay.toFixed(2)}</TableCell>
                              <TableCell className="font-bold">${totalRepresentativePay.toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Mat Official Tables */}
            {Object.entries(officialsPositions)
              .filter(([mat]) => !["undefined", "-1", "unassigned", "0"].includes(mat))
              .map(([mat, matOfficials]) => (
                <Card key={mat} className="mb-6">
                  <CardHeader>
                    <CardTitle>Mat {mat}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Position</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Bouts Judged</TableHead>
                          <TableHead>Bouts Reffed</TableHead>
                          <TableHead>Judge Pay</TableHead>
                          <TableHead>Referee Pay</TableHead>
                          <TableHead>Distance (miles)</TableHead>
                          <TableHead>Travel Pay</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matOfficials
                          .filter(official => official.id)
                          .map(official => {
                            if (!official.id) return null;

                            const stats = officialStats[official.id] || { amountJudged: 0, amountReffed: 0 };
                            const judgePayout = stats.amountJudged * judgePay;
                            const refereePayout = stats.amountReffed * refereePay;
                            const travelPay = distances[official.id] ? distances[official.id] * 0.55 : 0;
                            const totalPay = judgePayout + refereePayout + travelPay;

                            return (
                              <TableRow key={official.id}>
                                <TableCell>{official.location || 'N/A'}</TableCell>
                                <TableCell
                                  className="font-medium cursor-pointer"
                                  onClick={() => handleOfficialClick(official)}
                                >
                                  {official.first || 'N/A'} {official.last || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={stats.amountJudged}
                                    onChange={(e) => updateOfficialStats(official.id!, {
                                      ...stats,
                                      amountJudged: parseInt(e.target.value) || 0
                                    })}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-16 h-8 text-center"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={stats.amountReffed}
                                    onChange={(e) => updateOfficialStats(official.id!, {
                                      ...stats,
                                      amountReffed: parseInt(e.target.value) || 0
                                    })}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-16 h-8 text-center"
                                  />
                                </TableCell>
                                <TableCell>${judgePayout.toFixed(2)}</TableCell>
                                <TableCell>${refereePayout.toFixed(2)}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={distances[official.id] || 0}
                                    onChange={(e) => updateOfficialDistance(official.id!, parseFloat(e.target.value) || 0)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-16 h-8 text-center"
                                  />
                                </TableCell>
                                <TableCell>${travelPay.toFixed(2)}</TableCell>
                                <TableCell className="font-bold">${totalPay.toFixed(2)}</TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}

            {/* Summary Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Total Pay Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Officials Pay</p>
                    <p className="text-lg font-semibold">${totalPay.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Representatives Pay</p>
                    <p className="text-lg font-semibold">${totalRepresentativePay.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pay</p>
                    <p className="text-xl font-bold">${(totalPay + totalRepresentativePay).toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button onClick={captureScreenshot} className="w-full sm:w-auto">
                  <Printer className="h-4 w-4 mr-2" />
                  Export as Image
                </Button>
              </CardFooter>
            </Card>
          </ScrollArea>
        </div>
      </SheetContent>

      <OfficialInvoice
        open={showPopup}
        onOpenChange={setShowPopup}
        selectedOfficial={selectedOfficial}
        eventName={eventName}
        eventDate={eventDate}
        officialStats={officialStats}
        distances={distances}
        refereePay={refereePay}
        judgePay={judgePay}
        representativePay={representativePay}
        totalFighters={calculatedTotalFighters}
        onCopyInvoice={copyInvoiceToClipboard}
        onClose={closePopup}
      />
    </Sheet>
  );
};

export default OfficialsAccounting;