// app/fighter/[fighterId]/PageContent.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BoutSearch from "@/components/database/BoutSearch";
import { FullContactFighter } from '@/utils/types';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from "firebase/firestore";
import { db } from '@/lib/firebase_techbouts/config';
import { useRouter } from 'next/navigation';
import { AlertCircle, ChevronLeft, Edit, ChevronDown, ChevronUp, Save, X, Upload } from "lucide-react";
import VerifiedBoutsDisplay from "@/components/database/VerifiedBoutsDisplay";
import PhotoUpload from "@/components/images/PhotoUpload";

// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const defaultPhotoUrl = "/images/techbouts_fighter_icon.png";

interface FighterPageContentProps {
  fighter: FullContactFighter;
}

export function FighterPageContent({ fighter }: FighterPageContentProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(fighter);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  
  
  const isValidUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  
  
  const photoUrl = isValidUrl(formData.photo || fighter.photo) ? (formData.photo || fighter.photo) : defaultPhotoUrl;

  // Check if the logged-in user is the owner of this fighter profile
  const isFighter = user?.email && user.email.toLowerCase() === fighter.email?.toLowerCase();

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (["mt_win", "mt_loss", "boxing_win", "boxing_loss", "mma_win", "mma_loss", 
         "pmt_win", "pmt_loss", "weightclass", "height", "years_exp", "age"].includes(name)) {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };


  const handlePhotoUploadSuccess = (downloadUrl: string) => {
    setFormData({
      ...formData,
      photo: downloadUrl
    });
  };


  // Save updated fighter data
  const handleSave = async () => {
    if (!isFighter && !isAdmin) return;
    
    setIsSaving(true);
    setSaveError("");
    
    try {
      const fighterRef = doc(db, "techbouts_fighters", fighter.fighter_id);
      
      // Only update editable fields
      await updateDoc(fighterRef, {
        gym: formData.gym,
        email: formData.email,
        weightclass: formData.weightclass,
        height: formData.height,
        years_exp: formData.years_exp,
        state: formData.state,
        city: formData.city,
        photo: formData.photo
      });
      
      setEditMode(false);
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error("Error updating fighter profile:", error);
      setSaveError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  

  


  // Calculate total record for display
  const totalWins = 
    (fighter.mt_win-0 || 0) + 
    (fighter.boxing_win-0 || 0) + 
    (fighter.mma_win-0 || 0) + 
    (fighter.pmt_win-0 || 0);
  
  const totalLosses = 
    (fighter.mt_loss-0 || 0) + 
    (fighter.boxing_loss-0 || 0) + 
    (fighter.mma_loss-0 || 0) + 
    (fighter.pmt_loss-0 || 0);
  
  
  
  

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary">
            <Link href="/database">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Database
            </Link>
          </Button>
        </div>
        
        {/* Fighter Profile */}
        <Card className="mb-8">
          <CardHeader className="bg-primary text-primary-foreground">
            <div className="flex justify-between items-center">
              <CardTitle className="text-4xl">
                {fighter.first} {fighter.last}
              </CardTitle>
              {(isFighter || isAdmin) && (
                <div>
                  {editMode ? (
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        className="bg-primary-foreground text-primary"
                        onClick={() => setEditMode(false)}
                        disabled={isSaving}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button 
                        variant="secondary"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline"
                      className="bg-primary-foreground text-primary"
                      onClick={() => setEditMode(true)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Fighter Image */}
              <div className="flex flex-col items-center lg:items-start gap-4">
                <div className="relative w-64 h-64">
                <Image
                    src={photoUrl || defaultPhotoUrl}
                    alt={`${fighter.first} ${fighter.last}`}
                    fill
                    className="rounded-lg object-cover shadow-md"
                  />
                </div>
                
                {/* Photo Upload Button (only visible in edit mode) */}
                {editMode && (isFighter || isAdmin) && (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPhotoUploadOpen(true)}
                    className="w-full md:w-auto"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload Photo
                  </Button>
                )}
              </div>
              
              {/* Fighter Stats */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-muted">
                    <CardContent className="pt-4 text-center">
                      <h2 className="text-primary font-semibold text-sm">Record</h2>
                      <p className="text-foreground font-bold">{totalWins}-{totalLosses}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted">
                    <CardContent className="pt-4 text-center">
                      <h2 className="text-primary font-semibold text-sm">Gym</h2>
                      {editMode ? (
                        <Input
                          type="text"
                          name="gym"
                          value={formData.gym || ""}
                          onChange={handleInputChange}
                          className="mt-1 text-center"
                        />
                      ) : (
                        <p className="text-foreground font-bold">{fighter.gym || "Unknown"}</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted">
                    <CardContent className="pt-4 text-center">
                      <h2 className="text-primary font-semibold text-sm">Weight</h2>
                      {editMode ? (
                        <Input
                          type="number"
                          name="weightclass"
                          value={formData.weightclass || ""}
                          onChange={handleInputChange}
                          className="mt-1 text-center"
                        />
                      ) : (
                        <p className="text-foreground font-bold">{fighter.weightclass || "Unknown"} lbs</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted">
                    <CardContent className="pt-4 text-center">
                      <h2 className="text-primary font-semibold text-sm">Class</h2>
                      <p className="text-foreground font-bold">{fighter.class || "Unknown"}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted">
                    <CardContent className="pt-4 text-center">
                      <h2 className="text-primary font-semibold text-sm">Gender</h2>
                      <p className="text-foreground font-bold">{fighter.gender || "Unknown"}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted">
                    <CardContent className="pt-4 text-center">
                      <h2 className="text-primary font-semibold text-sm">Age</h2>
                      <p className="text-foreground font-bold">{fighter.age || "Unknown"}</p>
                    </CardContent>
                  </Card>
                </div>
                
                {saveError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{saveError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="text-muted-foreground text-center mt-4">
                  {editMode ? (
                    <div className="space-y-2">
                      <Label>Fighters Email:</Label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email || ""}
                        onChange={handleInputChange}
                        className="max-w-md mx-auto"
                      />
                    </div>
                  ) : (
                    <p>{isFighter || isAdmin ? `Fighter's Email: ${fighter.email}` : ""}</p>
                  )}
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* Fighter Details and Records */}
            <Tabs defaultValue="details" className="mt-6">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="details">Fighter Details</TabsTrigger>
                <TabsTrigger value="records">Fight Records</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {fighter.dob && (
                        <div className="flex justify-between items-center">
                          <Label className="text-muted-foreground">Date of Birth:</Label>
                          <span className="font-medium">{fighter.dob}</span>
                        </div>
                      )}
                      <Separator />
                      
                      <div className="flex justify-between items-center">
                        <Label className="text-muted-foreground">Height:</Label>
                        {editMode ? (
                          <Input
                            type="number"
                            name="height"
                            value={formData.height || ""}
                            onChange={handleInputChange}
                            className="w-24 text-right"
                          />
                        ) : (
                          <span className="font-medium">{fighter.height || "Not specified"}</span>
                        )}
                      </div>
                      <Separator />
                      
                      <div className="flex justify-between items-center">
                        <Label className="text-muted-foreground">Years Experience:</Label>
                        {editMode ? (
                          <Input
                            type="number"
                            name="years_exp"
                            value={formData.years_exp || ""}
                            onChange={handleInputChange}
                            className="w-24 text-right"
                          />
                        ) : (
                          <span className="font-medium">{fighter.years_exp || "Not specified"}</span>
                        )}
                      </div>
                      <Separator />
                      
                      <div className="flex justify-between items-center">
                        <Label className="text-muted-foreground">State:</Label>
                        {editMode ? (
                          <Input
                            type="text"
                            name="state"
                            value={formData.state || ""}
                            onChange={handleInputChange}
                            className="w-24 text-right"
                          />
                        ) : (
                          <span className="font-medium">{fighter.state || "Not specified"}</span>
                        )}
                      </div>
                      
                      {editMode && (
                        <>
                          <Separator />
                          <div className="flex justify-between items-center">
                            <Label className="text-muted-foreground">City:</Label>
                            <Input
                              type="text"
                              name="city"
                              value={formData.city || ""}
                              onChange={handleInputChange}
                              className="w-24 text-right"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="records" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-muted-foreground">Muay Thai:</Label>
                        <Badge variant="outline" className="font-medium">{fighter.mt_win}-{fighter.mt_loss}</Badge>
                      </div>
                      <Separator />
                      
                      {(fighter.boxing_win > 0 || fighter.boxing_loss > 0) && (
                        <>
                          <div className="flex justify-between items-center">
                            <Label className="text-muted-foreground">Boxing:</Label>
                            <Badge variant="outline" className="font-medium">{fighter.boxing_win}-{fighter.boxing_loss}</Badge>
                          </div>
                          <Separator />
                        </>
                      )}
                      
                      {(fighter.mma_win > 0 || fighter.mma_loss > 0) && (
                        <>
                          <div className="flex justify-between items-center">
                            <Label className="text-muted-foreground">MMA:</Label>
                            <Badge variant="outline" className="font-medium">{fighter.mma_win}-{fighter.mma_loss}</Badge>
                          </div>
                          <Separator />
                        </>
                      )}
                      
                      {(fighter.pmt_win > 0 || fighter.pmt_loss > 0) && (
                        <>
                          <div className="flex justify-between items-center">
                            <Label className="text-muted-foreground">PMT:</Label>
                            <Badge variant="outline" className="font-medium">{fighter.pmt_win}-{fighter.pmt_loss}</Badge>
                          </div>
                          <Separator />
                        </>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <Label className="font-semibold text-foreground">Total Record:</Label>
                        <Badge className="font-bold">{totalWins}-{totalLosses}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>


        <PhotoUpload
          fighterId={fighter.fighter_id}
          isOpen={isPhotoUploadOpen}
          onClose={() => setIsPhotoUploadOpen(false)}
          onSuccess={handlePhotoUploadSuccess}
        />


        {/* Fight History Section */}
        {fighter.fights && fighter.fights.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Fight History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Opponent</TableHead>
                      <TableHead>Weightclass</TableHead>
                      <TableHead>Bout Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fighter.fights.map((fight, index) => (
                      <TableRow key={index}>
                        <TableCell>{fight.date}</TableCell>
                        <TableCell>{fight.eventName}</TableCell>
                        <TableCell className="font-bold">
                          {fight.result === 'W' ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">Win</Badge>
                          ) : fight.result === 'L' ? (
                            <Badge variant="outline" className="text-red-600 border-red-600">Loss</Badge>
                          ) : (
                            <Badge variant="outline">{fight.result}</Badge>
                          )}
                        </TableCell>
                        <TableCell>{fight.opponent_id || 'N/A'}</TableCell>
                        <TableCell>{fight.weightclass} lbs</TableCell>
                        <TableCell>{fight.bout_type}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verified Bouts Section */}
        <VerifiedBoutsDisplay
          fighterId={fighter.fighter_id}
          isFighter={isFighter || isAdmin}
        />

        {/* Bout Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Verify Bout with Techbouts Web Scraper</CardTitle>
            <CardDescription>
              <Button 
                variant="ghost"
                onClick={toggleCollapse}
                className="flex items-center justify-center text-muted-foreground hover:text-primary text-center"
              >
                {isCollapsed ? (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show form
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide form
                  </>
                )}
              </Button>
            </CardDescription>
          </CardHeader>
          
          {!isCollapsed && (
            <CardContent>
              <BoutSearch
                firstName={fighter.first}
                lastName={fighter.last}
                fighterId={fighter.fighter_id}
              />
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}