// utils/apiFunctions/fetchTechBoutsEvent.ts
import { EventType } from '../types';
import { headers } from 'next/headers';

export async function fetchTechBoutsEvent(promoterId: string, eventId: string): Promise<EventType | null> {
  console.log('fetchTechBoutsEvent - Starting fetch for Promoter:', promoterId);

  console.log('fetchTechBoutsEvent - Starting fetch for eventId:', eventId);
  
  try {
    // Get the host from headers for server-side requests
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    
    const apiUrl = `${protocol}://${host}/api/events/${promoterId}/${eventId}`;
    console.log('fetchTechBoutsEvent - Calling API:', apiUrl);
    
    const response = await fetch(apiUrl, { cache: 'no-store' }); // Added no-store to prevent caching
    console.log('fetchTechBoutsEvent - API response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('fetchTechBoutsEvent - Event not found in TechBoutsEvent database');
        return null;
      }
      throw new Error(`Failed to fetch fetchTechBoutsEvent: ${response.status}`);
    }

    const { event: data } = await response.json();
    console.log('fetchTechBoutsEvent - Raw data received:', data);
    
    // Transform the data to match the Event type
    const eventData: EventType = {
      id: data.id || data.eventId,
      eventId: data.eventId || data.id,
      docId: data.docId || data.id,
      event_name: data.event_name,
      name: data.event_name,
      venue_name: data.venue_name || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      date: data.date,
      flyer: data.flyer || '',
      weighin_date: data.weighin_date || data.date,
      weighin_start_time: data.weighin_start_time || '',
      weighin_end_time: data.weighin_end_time || '',
      rules_meeting_time: data.rules_meeting_time || '',
      bouts_start_time: data.bouts_start_time || '',
      doors_open: data.doors_open || '',
      spectator_info: data.spectator_info || '',
      registration_enabled: data.registration_enabled || false,
      registration_fee: data.registration_fee || 0,
      tickets_enabled: data.tickets_enabled || false,
      ticket_enabled: data.tickets_enabled || false,
      ticket_price: data.ticket_price || 0,
      ticket_price_description: data.ticket_price_description || '',
      ticket_price2: data.ticket_price2 || 0,
      ticket_price2_description: data.ticket_price2_description || '',
      event_details: data.event_details || '',
      photos_enabled: data.photos_enabled || false,
      photos_price: data.photos_price || 0,
      sanctioning: data.sanctioning || 'IKF',
      promotionName: data.promotionName || '',
      email: data.email || '',
      promoterId: data.promoterId || '',
      promoterEmail: data.promoterEmail || '',
      status: data.status || 'pending',
      ticket_system_option: data.ticket_system_option || 'none',
      coordinates: data.coordinates || undefined,
      street: data.street,
      postal_code: data.postal_code,
      country: data.country,
      colonia: data.colonia,
      municipality: data.municipality,
      ticket_link: data.ticket_link,
      zip: data.zip,
      numMats: data.numMats,
      registration_link: data.registration_link,
      matches_link: data.matches_link,
      locale: data.locale || 'en',
      disableRegistration: data.disableRegistration || false,
      photoPackagePrice: data.photoPackagePrice || 0,
      coachRegEnabled: data.coachRegEnabled || false,
      coachRegPrice: data.coachRegPrice || 0,
      photoPackageEnabled: data.photoPackageEnabled || false,

      promotionLogoUrl: data.promotionLogoUrl || '',
      sanctioningLogoUrl: data.sanctioningLogoUrl || '',
      stripeAccountId: data.stripeAccountId || '',
      payLaterEnabled: data.payLaterEnabled || false,
      redirect_url: data.redirect_url || '',
      display_roster: data.display_roster || false,
      display_matches: data.display_matches || false,
      
    };

    console.log('fetchTechBoutsEvent - Transformed event data:', eventData);
    return eventData;
  } catch (error) {
    console.error('fetchTechBoutsEvent - Error:', error);
    return null;
  }
}