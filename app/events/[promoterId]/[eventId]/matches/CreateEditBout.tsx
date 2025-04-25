// app/events/[promoterId]/[eventId]/matches/CreateEditBout.tsx
'use client'
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { RosterFighter, EventType, Bout } from '@/utils/types';
import { createMatch, editBout, deleteBout } from '@/utils/events/matches';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { deleteFighterFromRoster } from '@/utils/apiFunctions/techboutsRoster';
import { deleteFighterPmtRoster } from '@/utils/apiFunctions/pmtRoster';

interface SaveBoutProps {
  action: 'create' | 'edit';
  roster: RosterFighter[];
  red: RosterFighter | null;
  blue: RosterFighter | null;
  weightclass: number;
  setWeightclass: (value: number) => void;
  bout_type: string;
  setBoutType: (value: string) => void;
  boutConfirmed: boolean;
  setBoutConfirmed: (value: boolean) => void;
  isCreatingMatch: boolean;
  setIsCreatingMatch: (val: boolean) => void;
  setRed: (val: RosterFighter | null) => void;
  setBlue: (val: RosterFighter | null) => void;
  promoterId: string;
  eventId: string;
  eventData: EventType;
  isAdmin: boolean;
  existingBoutId?: string;
  existingBouts: Bout[];
  onClose: () => void;
  sanctioning: string;
}


export default function CreateBout({
  red,
  blue,
  weightclass,
  setWeightclass,
  bout_type,
  setBoutType,
  boutConfirmed,
  setBoutConfirmed,
  isCreatingMatch,
  setIsCreatingMatch,
  setRed,
  setBlue,
  promoterId,
  eventId,
  eventData,
  action,
  existingBoutId,
  existingBouts,
  onClose,
  sanctioning,
}: SaveBoutProps) {
  const [boutNum, setBoutNum] = useState(1);
  const [ringNum, setRingNum] = useState(1);
  const [dayNum, setDayNum] = useState(1);
  const [originalBoutNum, setOriginalBoutNum] = useState<number | undefined>(undefined);


  const [openSections, setOpenSections] = useState({
    boutSettings: false,
  });
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };


  useEffect(() => {
    if (action !== 'create') return;
    const maxExistingBout = existingBouts
      .filter(b => b.ringNum === ringNum && b.dayNum === dayNum)
      .reduce((max, b) => Math.max(max, b.boutNum), 0);

    setBoutNum(maxExistingBout + 1);
  }, [action, existingBouts, ringNum, dayNum]);


  useEffect(() => {
    if (action === 'edit' && existingBoutId) {
      const existingBout = existingBouts.find(b => b.boutId === existingBoutId);
      if (existingBout) {
        setBoutNum(existingBout.boutNum);
        setRingNum(existingBout.ringNum);
        setDayNum(existingBout.dayNum);
        setOriginalBoutNum(existingBout.boutNum); // Store the original number
      }
    }
  }, [action, existingBoutId, existingBouts]);


  const handleSwapCorners = () => {
    if (!red || !blue) {
      toast.error("Cannot swap corners: both fighters must be selected");
      return;
    }
    const temp = red;
    setRed(blue);
    setBlue(temp);
  };

  const handleSaveBout = async () => {
    if (!red || !blue) {
      toast.error("Missing required fighters");
      return;
    }

    setIsCreatingMatch(true);
    try {
      if (action === 'create') {

        await createMatch({
          red,
          blue,
          weightclass,
          boutNum,
          ringNum,
          eventId,
          promoterId,
          setIsCreatingMatch,
          setRed,
          setBlue,
          date: eventData.date,
          sanctioning: eventData.sanctioning,
          eventName: eventData.event_name,
          promotionName: eventData.promoterId,
          bout_type,
          dayNum,
        });

        toast.success(`Bout ${boutNum} created successfully.`);
      } else {
        if (!existingBoutId) {
          toast.error("No existing boutId found for editing");
          return;
        }

        const updatedBout: Bout = {
          boutId: existingBoutId,
          weightclass,
          ringNum,
          boutNum,
          red,
          blue,
          methodOfVictory: '',
          confirmed: boutConfirmed,
          eventId,
          eventName: eventData.event_name,
          url: '',
          date: eventData.date,
          promotionId: promoterId,
          promotionName: eventData.promoterId,
          sanctioning: eventData.sanctioning,
          bout_type,
          dayNum,
          class: '',
        };

        await editBout({
          bout: updatedBout,
          promoterId,
          eventId,
          originalBoutNum,
        });

        toast.success("Bout updated successfully.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save bout");
    } finally {
      setIsCreatingMatch(false);
      onClose();
    }
  };


  const handleDeleteBout = async () => {
    if (!existingBoutId) {
      toast.error("No boutId to delete");
      return;
    }

    const confirm = window.confirm(`This will delete boutId: ${existingBoutId}. Continue?`);
    if (!confirm) return;

    try {
      await deleteBout({
        boutId: existingBoutId,
        promoterId,
        eventId
      });
      toast.success("Bout deleted.");
      onClose(); // close the modal/form if needed
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete bout");
    }
  };

  const isEdit = action === 'edit';


  const navigateToFighterDetail = (fighter: RosterFighter) => {
    const fighterId = fighter.fighter_id;
    if (fighterId) {
      window.open(`/fighter/${fighterId}`, '_blank');
    } else {
      console.error("Fighter ID not available for navigation");
    }
  };


  return (
    <Card className="fixed -top-10 left-0 w-full bg-gray-200 shadow z-50 border-b">
      <CardHeader>

      </CardHeader>
      <CardContent>
<div>Sanctioning: {sanctioning}</div>

        {/* TOP BUTTONS */}
        <div className="flex mb-4 space-x-2">

          <Button
            onClick={handleSaveBout}
            disabled={!red || !blue || isCreatingMatch}
          >
            {isCreatingMatch ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEdit ? "Update Bout" : "Create Bout"
            )}
          </Button>

          {/* If in edit mode, show delete */}
          {isEdit && (
            <Button variant="destructive" onClick={handleDeleteBout} disabled={isCreatingMatch}>
              Delete Bout
            </Button>
          )}

          <Button variant="outline" onClick={onClose} disabled={isCreatingMatch}>
            Close
          </Button>
        </div>




        <Collapsible
          open={openSections.boutSettings}
          onOpenChange={() => toggleSection('boutSettings')}
          className="w-full border rounded-lg overflow-hidden"
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-50 hover:bg-gray-100">
            <p className="text-xl font-semibold">Bout Settings</p> <p>bout: {boutNum} Ring: {ringNum} Day: {dayNum} Weight: {weightclass}</p>
            {openSections.boutSettings ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 bg-white">
            <div className="border rounded-md p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="boutNum">Bout Number</Label>
                <Input
                  id="boutNum"
                  type="number"
                  min="1"
                  value={boutNum}
                  onChange={(e) => setBoutNum(parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weightclass">Weight Class</Label>
                <Input
                  id="weightclass"
                  type="number"
                  value={weightclass === 0 ? '' : weightclass}
                  onChange={(e) => {
                    // e.target.valueAsNumber is either a number or NaN if invalid
                    setWeightclass(e.target.valueAsNumber || 0);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ring">Ring Number</Label>
                <Select
                  value={ringNum.toString()}
                  onValueChange={(val) => setRingNum(parseInt(val))}
                >
                  <SelectTrigger id="ring"><SelectValue placeholder="Select Ring" /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        Ring {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="boutConfirmed">Bout Confirmed</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="boutConfirmed"
                    checked={boutConfirmed}
                    onCheckedChange={setBoutConfirmed}
                  />
                  <span>{boutConfirmed ? "Yes" : "No"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dayNum">Event Day</Label>
                <Input
                  id="dayNum"
                  type="number"
                  min="1"
                  value={dayNum}
                  onChange={(e) => setDayNum(parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bout_type">Bout Type</Label>
                <Select value={bout_type} onValueChange={setBoutType}>
                  <SelectTrigger id="boutType"><SelectValue placeholder="Select Bout Type" /></SelectTrigger>
                  <SelectContent>
                    {["MT", "MMA", "Boxing", "PMT", "PB", "KB"].map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* SWAP CORNERS */}
              <div className="space-y-2">
                <Label htmlFor="swapCorners">Swap Corners</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSwapCorners}
                >
                  Swap Corners
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* SELECTED FIGHTERS */}
        <div className="">
          {/* Red Corner */}
          <div className="border border-black p-2 w-100 rounded-md">
            <p className="font-medium mb-2">Red Corner</p>
            {red ? (
              <div className="flex items-center justify-between w-full">
                <p className="font-semibold">{`${red.first || ''} ${red.last || ''}`}</p>
                <p>{red.gym || 'No gym'}</p>
                <p>{red.weightclass || 'No Weight'}</p>
                <p>{red.gender || 'No Gender'}</p>

              </div>
            ) : (
              <p className="text-muted-foreground">No fighter selected</p>
            )}

            {red && !blue && (
              <div className="flex items-center justify-end w-full">

                <Button
                  variant="outline"
                  size="sm"
                  className='mr-5'
                  onClick={() => navigateToFighterDetail(red)}
                >
                  Edit
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (sanctioning === "PMT") {
                      deleteFighterPmtRoster(red.fighter_id, eventId);
                    } else {
                      deleteFighterFromRoster(red.fighter_id, promoterId, eventId);
                    }
                    setRed(null);
                  }}
                >
                  Delete
                </Button>
              </div>
            )}

          </div>

          {/* Blue Corner */}
          <div className="border border-black p-2 w-100 rounded-md">

            {blue ? (

              <p className="mb-1">Blue Corner</p>
            ) : (<div></div>)}

            {blue ? (
              <div className="flex items-center justify-between w-full">
                <p className="text-lg font-semibold">{`${blue.first || ''} ${blue.last || ''}`}</p>
                <p className='ml-1'>{blue.gym || 'No gym'}</p>
                <p className='ml-1'>{blue.weightclass || 'No Weight'}</p>
                <p className='ml-1'>{blue.gender || 'Not Gender'}</p>

              </div>
            ) : (
              <p className="text-muted-foreground">Select Another Fighter to Create Match</p>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}