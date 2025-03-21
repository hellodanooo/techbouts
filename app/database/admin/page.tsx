// app/database/admin/page.tsx
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Header from '@/components/headers/Header';
import TransferPmtToTechbouts from './TransferPmtToTechbouts';
import EventsTab from '@/components/events/EventsTab'; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext'; // Import auth context
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function FighterDatabase() {
  const [activeTab, setActiveTab] = useState('events-monitor');
  const { isAdmin } = useAuth();

  // If user is not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Header />
        <div className="max-w-4xl mx-auto mt-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have permission to access this page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Header />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">TechBouts Fighter Database Administration</h1>
        <Image
          src="/logos/techboutslogoFlat.png"
          alt="TechBouts Database"
          width={125}
          height={62.5}
          className="rounded-lg"
        />
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Database Management</CardTitle>
          <CardDescription>
            Manage fighter records, process events, and monitor data synchronization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="events-monitor">Event Monitor</TabsTrigger>
              <TabsTrigger value="data-transfer">PMT Data Transfer</TabsTrigger>
            </TabsList>
            
            <TabsContent value="events-monitor" className="space-y-4">
              <h2 className="text-xl font-semibold">Event Processing Status</h2>
              <p className="text-muted-foreground">
                Monitor which events have been processed and which need attention.
              </p>
              <EventsTab />
            </TabsContent>
            
            <TabsContent value="data-transfer">
              <h2 className="text-xl font-semibold">PMT to TechBouts Data Transfer</h2>
              <p className="text-muted-foreground mb-4">
                Calculate fighter records from PMT and transfer them to TechBouts database.
              </p>
              
              {/* The Transfer Component */}
              <TransferPmtToTechbouts />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          TechBouts Database Administration • {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}