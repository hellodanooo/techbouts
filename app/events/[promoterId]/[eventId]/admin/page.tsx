// app/events/[promoterId]/[eventId]/edit/page.tsx
import { notFound } from 'next/navigation';
import { fetchPmtEvent } from '@/utils/apiFunctions/fetchPmtEvent';

import {fetchPmtRoster} from '@/utils/apiFunctions/fetchPmtRoster';

import { fetchTechBoutsEvent } from '@/utils/apiFunctions/fetchTechBoutsEvent';

import {fetchTechBoutsRoster} from '@/utils/apiFunctions/fetchTechBoutsRoster';

import PageDashboard from './PageDashboard';
import { fetchTechboutsBouts } from '@/utils/apiFunctions/fetchTechboutsBouts'; 


//import { fetchPuristRoster } from '@/utils/apiFunctions/fetchPuristRoster';



export default async function EditEventRoute({ 
  params 
}: { 
  params: Promise<{ promoterId: string,  eventId: string }> 
}) {
  const { promoterId, eventId } = await params;

  console.log('edit page promoterId:', promoterId);
  console.log('edit page eventId:', eventId);

  let roster = null;
  // Try to fetch PMT event first

  let eventData = await fetchPmtEvent(eventId);
if (eventData) {
  eventData.sanctioning = "PMT"
  roster = await fetchPmtRoster(eventId);
}

  if (!eventData) {
    eventData = await fetchTechBoutsEvent(promoterId, eventId);
    roster = await fetchTechBoutsRoster(promoterId, eventId);
  }

  if (!eventData) {
    notFound();
  }


  const matchesData = await fetchTechboutsBouts(promoterId, eventId);


  return (
    <div>
      
      <PageDashboard
      eventId={eventId}
      eventData={eventData}
      roster={roster}
      bouts={matchesData}
      promoterId={promoterId}
    />
    </div>
  );
}