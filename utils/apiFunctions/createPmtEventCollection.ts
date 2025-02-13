import { EventType } from '@/utils/types';

export async function createPmtEventCollection(eventData: EventType): Promise<{ success: boolean; message?: string }> {
  try {

console.log("Handle API Function Called with Data:",eventData);

    const response = await fetch('/api/pmt/events/createEventCollection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData), // ✅ Send full event data
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create event collection');
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error creating event collection:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}
