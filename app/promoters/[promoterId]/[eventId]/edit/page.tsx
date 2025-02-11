// app/promoters/[promoterId]/[eventId]/edit/page.tsx
import EditEventForm from './EditEventForm';
import { notFound } from 'next/navigation';
import { fetchPmtEvent } from '@/utils/apiFunctions/fetchPmtEvent';

export default async function EditEventRoute({ 
  params 
}: { 
  params: Promise<{ promoterId: string, eventId: string }> 
}) {
  const { promoterId, eventId } = await params;

  console.log('edit page promoterId:', promoterId);
  console.log('edit page eventId:', eventId);

  // Fetch data
  const eventData = await fetchPmtEvent(eventId);

  if (!eventData) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Event</h1>
      <EditEventForm 
        eventData={eventData}
        promoterId={promoterId}
      />
    </div>
  );
}