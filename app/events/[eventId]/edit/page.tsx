// app/events/[eventId]/edit/page.tsx
import EditEventForm from './EditEventForm';
import { notFound } from 'next/navigation';
import { fetchPmtEvent } from '@/utils/apiFunctions/fetchPmtEvent';
import { fetchTechBoutsEvent } from '@/utils/apiFunctions/fetchTechBoutsEvent';
import OfficialsEvent from './OfficialsEvent';


export default async function EditEventRoute({ 
  params 
}: { 
  params: Promise<{ eventId: string }> 
}) {
  const { eventId } = await params;

  console.log('edit page eventId:', eventId);

  // Try to fetch PMT event first
  let eventData = await fetchPmtEvent(eventId);

  // If not found, try TechBouts
  if (!eventData) {
    eventData = await fetchTechBoutsEvent(eventId);
  }

  if (!eventData) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Event</h1>
      <EditEventForm 
        eventData={eventData}
        eventId={eventId}
      />
<div style={{
  marginTop: '20px',
  borderTop: '1px solid #ccc',
  paddingTop: '20px'
}}>
<OfficialsEvent
        eventId={eventId} numMats={eventData.numMats} 
      />

</div>
    

    </div>
  );
}