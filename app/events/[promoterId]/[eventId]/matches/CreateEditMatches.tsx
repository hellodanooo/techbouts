// app/events/[promoterId]/[eventId]/matches/CreateEditMatches.tsx
'use client'
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { RosterFighter, EventType, Bout, Bracket } from '@/utils/types';
import { createMatch, editBout, deleteBout } from '@/utils/events/matches';
// Import the bracket functions
import { saveByeBracket, saveFourManBracket } from '@/utils/events/matches';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { deleteFighterFromRoster } from '@/utils/apiFunctions/techboutsRoster';
import { deleteFighterPmtRoster } from '@/utils/apiFunctions/pmtRoster';
import UpdateBoutResults from './UpdateBoutResults';
import { FaTrashAlt } from "react-icons/fa";
import { FighterDisplay } from "@/components/matches/BoutDisplay";
import { Table, TableBody } from "@/components/ui/table";
import { BoutRow } from "@/components/matches/BoutDisplay";
import { FullBracketDisplay } from "@/components/matches/FullBracketDisplay";
import { ByeBracketDisplay } from "@/components/matches/ByeBracketDisplay";

interface SaveBoutProps {
  action: 'create' | 'edit';
  roster: RosterFighter[];
  red: RosterFighter | null;
  blue: RosterFighter | null;
  third: RosterFighter | null; // Add third fighter
  fourth: RosterFighter | null; // Add fourth fighter
  weightclass: number;
  setWeightclass: (value: number) => void;
  boutConfirmed: boolean;
  setBoutConfirmed: (value: boolean) => void;
  isCreatingMatch: boolean;
  setIsCreatingMatch: (val: boolean) => void;
  setRed: (val: RosterFighter | null) => void;
  setBlue: (val: RosterFighter | null) => void;
  setThird: (val: RosterFighter | null) => void; // Add setter for third fighter
  setFourth: (val: RosterFighter | null) => void; // Add setter for fourth fighter
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
  third,
  fourth,
  weightclass,
  setWeightclass,
  boutConfirmed,
  setBoutConfirmed,
  isCreatingMatch,
  setIsCreatingMatch,
  setRed,
  setBlue,
  setThird,
  setFourth,
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
  const [showUpdateResults, setShowUpdateResults] = useState(false);
  const [isBracketMode, setIsBracketMode] = useState(false);
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [bracketName, setBracketName] = useState('');
  const [openSections, setOpenSections] = useState({
    boutSettings: false,
  });
  const [bout_ruleset, setBoutRuleset] = useState("MT");

  useEffect(() => {
    if (sanctioning === "PBSC") {
      setBoutRuleset("PBOX");
    } else if (sanctioning === "PMT") {
      setBoutRuleset("PMT");
    } else if (sanctioning === "IKF") {
      setBoutRuleset("MT");
    }
  }, [sanctioning]);


  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };




  
  // Check if we should switch to bracket mode when third fighter is selected
  useEffect(() => {
    if (third) {
      setIsBracketMode(true);
      updateBracket();
    } else {
      setIsBracketMode(false);
      setBracket(null);
    }
  }, [red, blue, third, fourth, boutNum, ringNum, dayNum, weightclass]);

  // Update the bracket whenever fighters or bout settings change
// Update the bracket whenever fighters or bout settings change
const updateBracket = () => {
  if (!red || !blue) return;

  // Generate a unique temporary bracketId (will be replaced when saved)

  // Create semifinal 1 with red and blue fighters
  const semifinal1: Bout = {
    boutId: `day${dayNum}ring${ringNum}bout${boutNum}_semi1${sanctioning}${promoterId}${eventId}`,
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
    bout_ruleset,
    dayNum,
    class: '',
  };

  // For 3 fighters, set the third fighter as the bye
  if (third && !fourth) {
    const newBracket: Bracket = {
      bouts: [semifinal1],
      bye: third,
    };
    setBracket(newBracket);
    // Set default bracket name - use first and last (not first_name/last_name)
    setBracketName(`${weightclass}lbs ${third.first} ${third.last} Bye Bracket`);
  } 
  // For 4 fighters, create semifinal 2 with third and fourth fighters
  else if (third && fourth) {
    const semifinal2: Bout = {
      boutId: `day${dayNum}ring${ringNum}bout${boutNum + 1}_semi2${sanctioning}${promoterId}${eventId}`,
      weightclass,
      ringNum,
      boutNum: boutNum + 1,
      red: third,
      blue: fourth,
      methodOfVictory: '',
      confirmed: boutConfirmed,
      eventId,
      eventName: eventData.event_name,
      url: '',
      date: eventData.date,
      promotionId: promoterId,
      promotionName: eventData.promoterId,
      sanctioning: eventData.sanctioning,
      bout_ruleset,
      dayNum,
      class: '',
    };

    const newBracket: Bracket = {
      bouts: [semifinal1, semifinal2],
    };
    setBracket(newBracket);
    // Set default bracket name
    setBracketName(`${weightclass}lbs 4-Fighter Tournament`);
  }
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
      // If in bracket mode, save bracket using the specialized functions
      if (isBracketMode && bracket) {
        // For bracket with 3 fighters (with bye)
        if (third && !fourth) {
          // Use the saveByeBracket function to save the bracket to Firestore
          const success = await saveByeBracket({
            semifinalBout: {
              boutId: `day${dayNum}ring${ringNum}bout${boutNum}_semi1${sanctioning}${promoterId}${eventId}`,
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
              bout_ruleset,
              dayNum,
              class: '',
            },
            byeFighter: third,
            promoterId, 
            eventId,
            bracketName,
          });

          if (success) {
            toast.success(`3-Fighter bracket with bye created successfully`);
          } else {
            toast.error("Failed to create bracket with bye");
          }
        } 
        // For bracket with 4 fighters (two semifinals)
        else if (third && fourth) {
          // Use the saveFourManBracket function to save the bracket to Firestore
          const success = await saveFourManBracket({
            semifinal1: {
              boutId: `day${dayNum}ring${ringNum}bout${boutNum}_semi1${sanctioning}${promoterId}${eventId}`,
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
              bout_ruleset,
              dayNum,
              class: '',
            },
            semifinal2: {
              boutId: `day${dayNum}ring${ringNum}bout${boutNum + 1}_semi2${sanctioning}${promoterId}${eventId}`,
              weightclass,
              ringNum,
              boutNum: boutNum + 1,
              red: third,
              blue: fourth,
              methodOfVictory: '',
              confirmed: boutConfirmed,
              eventId,
              eventName: eventData.event_name,
              url: '',
              date: eventData.date,
              promotionId: promoterId,
              promotionName: eventData.promoterId,
              sanctioning: eventData.sanctioning,
              bout_ruleset,
              dayNum,
              class: '',
            },
            promoterId,
            eventId,
            bracketName,
          });

          if (success) {
            toast.success(`4-Fighter bracket created successfully`);
          } else {
            toast.error("Failed to create 4-fighter bracket");
          }
        }

        // Reset all fighters after creating bracket
        setRed(null);
        setBlue(null);
        setThird(null);
        setFourth(null);
      } else {
        // Regular single bout creation
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
            bout_ruleset,
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
            bout_ruleset,
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

  const currentBout = existingBoutId ? existingBouts.find(b => b.boutId === existingBoutId) : null;

  const handleDeleteFighter = (fighter: RosterFighter) => {
    const fighterId = fighter.fighter_id;
    if (fighterId) {
      if (sanctioning === "PMT") {
        deleteFighterPmtRoster(fighterId, eventId);
      } else {
        deleteFighterFromRoster(fighterId, promoterId, eventId);
      }
      
      // Update the state
      if (fighter === red) {
        setRed(null);
      } else if (fighter === blue) {
        setBlue(null);
      } else if (fighter === third) {
        setThird(null);
      } else if (fighter === fourth) {
        setFourth(null);
      }
    }
  };

  const handleClearBracket = () => {
    setRed(null);
    setBlue(null);
    setThird(null);
    setFourth(null);
    setIsBracketMode(false);
    setBracket(null);
  };

  return (
    <Card className="fixed top-0 left-0 w-full bg-gray-200 shadow z-50 border-b">
      <CardHeader>
        {isBracketMode ? (
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Tournament Bracket Creation</h2>
            <div className="text-sm bg-yellow-100 px-3 py-1 rounded-full">
              {third && !fourth ? '3-Fighter Bracket (with Bye)' : '4-Fighter Bracket'}
            </div>
          </div>
        ) : (
          <div>Sanctioning: {sanctioning} boutId: {existingBoutId}</div>
        )}
      </CardHeader>
      <CardContent>
        {showUpdateResults && currentBout && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="w-full max-w-md">
              <UpdateBoutResults
                bout={currentBout}
                promoterId={promoterId}
                eventId={eventId}
                onClose={() => setShowUpdateResults(false)}
                onSuccess={() => {
                  setShowUpdateResults(false);
                  // Optionally refresh the bout data here
                }}
              />
            </div>
          </div>
        )}

        <Collapsible
          open={openSections.boutSettings}
          onOpenChange={() => toggleSection('boutSettings')}
          className="w-full border rounded-lg overflow-hidden"
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-50 hover:bg-gray-100">
            <p className="text-xl font-semibold">
              {isBracketMode ? 'Bracket Settings' : 'Bout Settings'}
            </p> 
            <p>bout: {boutNum} Ring: {ringNum} Day: {dayNum} Weight: {weightclass}</p>
            {openSections.boutSettings ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </CollapsibleTrigger>
            <CollapsibleContent className="p-2 bg-white">
            <div className="border rounded-md p-2 space-y-2 h-1/2 overflow-y-auto">
              {/* Add bracket name input field when in bracket mode */}
              {isBracketMode && (
                <div className="space-y-2">
                  <Label htmlFor="bracketName">Bracket Name</Label>
                  <Input
                    id="bracketName"
                    value={bracketName}
                    onChange={(e) => setBracketName(e.target.value)}
                    placeholder={`${weightclass}lbs Tournament`}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="boutNum">
                  {isBracketMode ? 'Starting Bout Number' : 'Bout Number'}
                </Label>
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
                <Label htmlFor="bout_ruleset">Bout Ruleset</Label>
                <Select 
              value={bout_ruleset}
              onValueChange={setBoutRuleset}
              >
                <SelectTrigger id="bout_ruleset">
          <SelectValue placeholder="Select Bout Ruleset" />
        </SelectTrigger>
        <SelectContent>
          {["MT","MMA","BOX","PMT","PBOX","KBOX"].map(type => (
            <SelectItem key={type} value={type}>{type}</SelectItem>
          ))}
        </SelectContent>
      </Select>
              </div>




              {/* SWAP CORNERS (only show in non-bracket mode) */}
              {!isBracketMode && (
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
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* SELECTED FIGHTERS */}
        <div className="mt-4">
          {/* BRACKET MODE DISPLAY */}
          {isBracketMode && bracket ? (
            third && fourth ? (
              // 4-fighter bracket
              <FullBracketDisplay
                bracket={bracket}
                handleFighterClick={navigateToFighterDetail}
                onClearBracket={handleClearBracket}
              />
            ) : third ? (
              // 3-fighter bracket with bye
              <ByeBracketDisplay
                bracket={bracket}
                handleFighterClick={navigateToFighterDetail}
                onClearBracket={handleClearBracket}
              />
            ) : (
              // Fallback - shouldn't reach here if code is working correctly
              <div className="p-4 border border-dashed rounded-lg bg-gray-50 text-center">
                <p className="text-sm text-gray-500">
                  Select at least 3 fighters to create a tournament bracket.
                </p>
              </div>
            )
          ) : red && blue ? (
            /* NORMAL BOUT DISPLAY */
            <div className="w-full border border-gray-300 rounded-md overflow-hidden">
              <Table>
                <TableBody>
                  <BoutRow 
                      bout={{
                        boutId: existingBoutId || 'preview',
                        red,
                        blue,
                        weightclass,
                        boutNum,
                        ringNum,
                        dayNum,
                        bout_ruleset,
                        confirmed: boutConfirmed,
                        eventId,
                        eventName: eventData.event_name,
                        date: eventData.date,
                        sanctioning: eventData.sanctioning,
                        url: '',
                        promotionId: promoterId,
                        promotionName: eventData.promoterId,
                        class: '',
                        methodOfVictory: '',
                      }}
                      index={0}
                      isAdmin={false}
                      handleFighterClick={navigateToFighterDetail}
                      onBoutSelect={() => toggleSection('boutSettings')} allBouts={[]}                  />
                </TableBody>
              </Table>
            </div>
          ) : (
            /* FIGHTER SELECTION DISPLAY */
            <div className="space-y-4">
              {/* Red Corner */}
              <FighterDisplay
                fighter={red}
                corner="red"
                handleFighterClick={navigateToFighterDetail}
                handleEditFighter={navigateToFighterDetail}
                handleDeleteFighter={!blue ? handleDeleteFighter : undefined}
                showControls={!blue && !!red}
              />

              {/* Blue Corner */}
              <FighterDisplay
                fighter={blue}
                corner="blue"
                handleFighterClick={navigateToFighterDetail}
                handleDeleteFighter={blue ? handleDeleteFighter : undefined}
                showControls={!!blue}
              />
              
              {/* Only show if red and blue are selected */}
              {red && blue && (
                <>
                  {/* Third Fighter (needed for bracket) */}
                  <FighterDisplay
                    fighter={third}
                    corner="red"
                    handleFighterClick={navigateToFighterDetail}
                    handleDeleteFighter={third ? handleDeleteFighter : undefined}
                    showControls={!!third}
                  />
                  
                  {/* Fourth Fighter (completes the bracket) */}
                  {third && (
                    <FighterDisplay
                      fighter={fourth}
                      corner="blue"
                      handleFighterClick={navigateToFighterDetail}
                      handleDeleteFighter={fourth ? handleDeleteFighter : undefined}
                      showControls={!!fourth}
                    />
                  )}
                </>
              )}
            </div>
          )}

{/* BUTTONS */}
<div className="flex mt-4 space-x-2 justify-center">
          {isEdit && existingBoutId && (
            <Button 
              variant="secondary" 
              onClick={() => setShowUpdateResults(true)}
              disabled={isCreatingMatch}
            >
              Result
            </Button>
          )}

          {/* If in edit mode, show delete */}
          {isEdit && (
            <Button variant="destructive" onClick={handleDeleteBout} disabled={isCreatingMatch}>
              <FaTrashAlt />
            </Button>
          )}
          
          <Button
            onClick={handleSaveBout}
            disabled={!red || !blue || isCreatingMatch}
            style={{ backgroundColor: 'green', color: 'white' }}
          >
            {isCreatingMatch ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {isBracketMode ? "Creating Bracket..." : isEdit ? "Updating..." : "Creating..."}
              </>
            ) : (
              isBracketMode ? "Create Bracket" : isEdit ? "Update Bout" : "Create Bout"
            )}
          </Button>
          
          <Button variant="outline" onClick={onClose} disabled={isCreatingMatch}>
            Close
          </Button>
        </div>

        </div>

     
    

      </CardContent>
    </Card>
  );
}