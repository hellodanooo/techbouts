// app/events/[promoterId]/[eventId]/edit/page.tsx
import { notFound } from 'next/navigation';
import { fetchPmtEvent } from '@/utils/apiFunctions/fetchPmtEvent';

//import {fetchPmtRoster} from '@/utils/apiFunctions/fetchPmtRoster';

import { fetchTechBoutsEvent } from '@/utils/apiFunctions/fetchTechBoutsEvent';

//import {fetchTechBoutsRoster} from '@/utils/apiFunctions/fetchTechBoutsRoster';

//import { fetchPuristRoster } from '@/utils/apiFunctions/fetchPuristRoster';

import OfficialsEvent from '../edit/OfficialsEvent';

export default async function EditEventRoute({ 
  params 
}: { 
  params: Promise<{ promoterId: string,  eventId: string }> 
}) {
  const { promoterId, eventId } = await params;

  console.log('edit page promoterId:', promoterId);
  console.log('edit page eventId:', eventId);

 // let roster = null;
  // Try to fetch PMT event first

  let eventData = await fetchPmtEvent(eventId);
  
// if (eventData) {
//   eventData.sanctioning = "PMT"
//   roster = await fetchPmtRoster(eventId);
// }

  if (!eventData) {
    eventData = await fetchTechBoutsEvent(promoterId, eventId);
   // roster = await fetchTechBoutsRoster(promoterId, eventId);
  
  }

  if (!eventData) {
    notFound();
  }

// if (eventData.promoterId === 'muaythaipurist') {
//   roster = await fetchPuristRoster(eventId);
//   console.log('purist roster:', roster);
// }


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Event Dashboard</h1>
      <div>Sanctioning: {eventData.sanctioning}</div>
      
      <div className='mb-6'> 
     
     
</div>
    
  


    <div style={{
  marginTop: '20px',
  borderTop: '1px solid #ccc',
  paddingTop: '20px'
}}>
  
 <OfficialsEvent
        eventId={eventId} 
        numMats={eventData.numMats} 
        promoterId={eventData.promoterId}
        sanctioning={eventData.sanctioning}
        eventName={eventData.event_name}
        eventDate={eventData.date}
        eventAddress={eventData.address}
      /> 

</div>

    </div>
  );
}