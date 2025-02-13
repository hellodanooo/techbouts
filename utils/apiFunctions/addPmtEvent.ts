// utils/apiFunctions/addPmtEvent.ts
import { EventType } from '../types';

export async function addPmtEvent(eventData: Partial<EventType>) {
  try {
    console.log('Sending event data:', JSON.stringify(eventData, null, 2));

    const response = await fetch('/api/pmt/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });

    const responseData = await response.json();
    console.log('Full Response:', response.status, response.statusText, responseData);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${responseData.message}`);
    }

    return { success: true, event: responseData.event };
  } catch (error) {
    console.error('Error creating PMT event:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to create PMT event' };
  }
}