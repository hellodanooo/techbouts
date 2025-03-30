// components/CreateBout.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RosterFighter } from '@/utils/types';

interface CreateBoutProps {
  red: RosterFighter | null;
  blue: RosterFighter | null;
  boutNum: number;
  setBoutNum: (value: number) => void;
  weightclass: number;
  setWeightclass: (value: number) => void;
  ringNum: number;
  setRingNum: (value: number) => void;
  dayNum: number;
  setDayNum: (value: number) => void;
  bout_type: string;
  setBoutType: (value: string) => void;
  boutConfirmed: boolean;
  setBoutConfirmed: (value: boolean) => void;
  isCreatingMatch: boolean;
  setRed: (value: RosterFighter | null) => void;
  setBlue: (value: RosterFighter | null) => void;
  createMatch: () => void;
  disableCreate: boolean;
}

export default function CreateBout({
  red,
  blue,
  boutNum,
  setBoutNum,
  weightclass,
  setWeightclass,
  ringNum,
  setRingNum,
  dayNum,
  setDayNum,
  bout_type,
  setBoutType,
  boutConfirmed,
  setBoutConfirmed,
  isCreatingMatch,
  setRed,
  setBlue,
  createMatch,
  disableCreate
}: CreateBoutProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Selected Fighters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Red Corner */}
          <div className="space-y-4">
            <div className="border rounded-md p-4 h-full">
              <h3 className="font-medium mb-2">Red Corner</h3>
              {red ? (
                <div>
                  <p className="text-lg font-semibold">{`${red.first || ''} ${red.last || ''}`}</p>
                  <p>{red.gym || 'No gym'}</p>
                  <p>Weight: {red.weightclass || 'Not specified'}</p>
                  <p>Gender: {red.gender || 'Not specified'}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setRed(null)}>
                    Clear
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">No fighter selected</p>
              )}
            </div>
          </div>

          {/* Bout Settings */}
          <div className="space-y-4">
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Bout Settings</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="bout">Bout Number</Label>
                  <Input id="boutNum" type="number" min="1" value={boutNum} onChange={(e) => setBoutNum(parseInt(e.target.value))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weightclass">Weight Class</Label>
                  <Input id="weightclass" type="number" value={weightclass || ''} onChange={(e) => setWeightclass(parseFloat(e.target.value))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ring">Ring Number</Label>
                  <Select value={ringNum.toString()} onValueChange={(val) => setRingNum(parseInt(val))}>
                    <SelectTrigger id="ring"><SelectValue placeholder="Select Ring" /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map(num => (
                        <SelectItem key={num} value={num.toString()}>Ring {num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="boutConfirmed">Bout Confirmed</Label>
                  <div className="flex items-center justify-center space-x-2">
                    <Switch id="boutConfirmed" checked={boutConfirmed} onCheckedChange={setBoutConfirmed} />
                    <span>{boutConfirmed ? "Yes" : "No"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dayNum">Event Day</Label>
                  <Input id="dayNum" type="number" min="1" value={dayNum} onChange={(e) => setDayNum(parseInt(e.target.value))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bout_type">Bout Type</Label>
                  <Select value={bout_type} onValueChange={setBoutType}>
                    <SelectTrigger id="boutType"><SelectValue placeholder="Select Bout Type" /></SelectTrigger>
                    <SelectContent>
                      {["MT", "MMA", "Boxing", "PMT", "PB", "KB"].map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={createMatch} disabled={disableCreate} className="w-full mt-4">
                {isCreatingMatch ? "Creating Match..." : "Create Match"}
              </Button>
            </div>
          </div>

          {/* Blue Corner */}
          <div className="space-y-4">
            <div className="border rounded-md p-4 h-full">
              <h3 className="font-medium mb-2">Blue Corner</h3>
              {blue ? (
                <div>
                  <p className="text-lg font-semibold">{`${blue.first || ''} ${blue.last || ''}`}</p>
                  <p>{blue.gym || 'No gym'}</p>
                  <p>Weight: {blue.weightclass || 'Not specified'}</p>
                  <p>Gender: {blue.gender || 'Not specified'}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setBlue(null)}>
                    Clear
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">No fighter selected</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
