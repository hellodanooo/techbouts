// app/events/[promoterId]/[eventId]/matches/UpdateBoutResults.tsx
'use client'
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';
import { RefreshCw } from "lucide-react";
import { updateBoutResults } from '@/utils/events/matches';
import { Bout } from '@/utils/types';

interface UpdateBoutResultsProps {
  bout: Bout;
  promoterId: string;
  eventId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function UpdateBoutResults({
  bout,
  promoterId,
  eventId,
  onClose,
  onSuccess,
}: UpdateBoutResultsProps) {
  const [redResult, setRedResult] = useState<'W' | 'L' | 'NC' | 'DQ' | 'DRAW' | '-'>(bout.red.result || '-');
  const [blueResult, setBlueResult] = useState<'W' | 'L' | 'NC' | 'DQ' | 'DRAW' | '-'>(bout.blue.result || '-');
  const [methodOfVictory, setMethodOfVictory] = useState(bout.methodOfVictory || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const resultOptions = ['W', 'L', 'NC', 'DQ', 'DRAW', '-'];

  // Function to automatically set opposite result
  const handleResultChange = (corner: 'red' | 'blue', result: string) => {
    if (corner === 'red') {
      setRedResult(result as 'W' | 'L' | 'NC' | 'DQ' | 'DRAW' | '-');
      // Automatically set opposite result for blue if applicable
      if (result === 'W') setBlueResult('L');
      else if (result === 'L') setBlueResult('W');
      else if (result === 'DRAW') setBlueResult('DRAW');
      else if (result === 'NC') setBlueResult('NC');
    } else {
      setBlueResult(result as 'W' | 'L' | 'NC' | 'DQ' | 'DRAW' | '-');
      // Automatically set opposite result for red if applicable
      if (result === 'W') setRedResult('L');
      else if (result === 'L') setRedResult('W');
      else if (result === 'DRAW') setRedResult('DRAW');
      else if (result === 'NC') setRedResult('NC');
    }
  };

  const handleSubmit = async () => {
    setIsUpdating(true);
    try {
      const success = await updateBoutResults({
        boutId: bout.boutId,
        redResult,
        blueResult,
        methodOfVictory,
        promoterId,
        eventId,
      });

      if (success) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error updating results:", error);
      toast.error("Failed to update results");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-xl font-semibold">Update Bout Results</h3>
        <p className="text-sm text-muted-foreground">
          Bout {bout.boutNum} - {bout.red.first} {bout.red.last} vs {bout.blue.first} {bout.blue.last}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Red Corner Result */}
          <div className="space-y-2">
            <Label htmlFor="redResult">{bout.red.first} {bout.red.last} (Red Corner)</Label>
            <Select
              value={redResult}
              onValueChange={(val) => handleResultChange('red', val)}
            >
              <SelectTrigger id="redResult">
                <SelectValue placeholder="Select Result" />
              </SelectTrigger>
              <SelectContent>
                {resultOptions.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Blue Corner Result */}
          <div className="space-y-2">
            <Label htmlFor="blueResult">{bout.blue.first} {bout.blue.last} (Blue Corner)</Label>
            <Select
              value={blueResult}
              onValueChange={(val) => handleResultChange('blue', val)}
            >
              <SelectTrigger id="blueResult">
                <SelectValue placeholder="Select Result" />
              </SelectTrigger>
              <SelectContent>
                {resultOptions.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Method of Victory */}
          <div className="space-y-2">
            <Label htmlFor="methodOfVictory">Method of Victory</Label>
            <Input
              id="methodOfVictory"
              value={methodOfVictory}
              onChange={(e) => setMethodOfVictory(e.target.value)}
              placeholder="e.g., KO, TKO, Decision, etc."
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Results'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}