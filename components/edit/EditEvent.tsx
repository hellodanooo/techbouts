"use client";

import React from 'react';
import { Event } from '@/utils/types';
import { format, parseISO } from 'date-fns';


interface EventOptionsProps {
  event: Event;
}


const EventOptions: React.FC<EventOptionsProps> = ({ event }) => {
  const formatTime = (timeString: string) => {
    try {
      return format(parseISO(`2000-01-01T${timeString}`), 'h:mm a');
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h3 className="text-xl font-semibold">{event.event_name}</h3>
        <p className="text-sm text-gray-600">{event.competition_type}</p>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-700">Date & Time</h4>
          <p>{formatDate(event.date)}</p>
          <p>Doors: {formatTime(event.doors_open)}</p>
          <p>Bouts Start: {formatTime(event.bouts_start_time)}</p>
        </div>

        <div>
          <h4 className="font-medium text-gray-700">Location</h4>
          <p>{event.venue_name}</p>
          <p>{event.address}</p>
          <p>{event.city}, {event.state} {event.zip}</p>
        </div>
      </section>

      <section className="space-y-2">
        <h4 className="font-medium text-gray-700">Weigh-in Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Date</p>
            <p>{formatDate(event.weighin_date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Time</p>
            <p>{formatTime(event.weighin_start_time)} - {formatTime(event.weighin_end_time)}</p>
          </div>
        </div>
        <p className="text-sm">Rules Meeting: {formatTime(event.rules_meeting_time)}</p>
      </section>

      {(event.registration_enabled || event.tickets_enabled || event.coach_enabled || event.photos_enabled) && (
        <section className="space-y-2">
          <h4 className="font-medium text-gray-700">Pricing</h4>
          <div className="grid grid-cols-2 gap-4">
            {event.registration_enabled && (
              <div>
                <p className="text-sm text-gray-600">Registration</p>
                <p>{formatCurrency(event.registration_fee)}</p>
              </div>
            )}
            {event.tickets_enabled && (
              <div>
                <p className="text-sm text-gray-600">Tickets</p>
                <p>{formatCurrency(event.ticket_price)} - {event.ticket_price_description}</p>
                {event.ticket_price2 > 0 && (
                  <p>{formatCurrency(event.ticket_price2)} - {event.ticket_price2_description}</p>
                )}
              </div>
            )}
            {event.coach_enabled && (
              <div>
                <p className="text-sm text-gray-600">Coach Pass</p>
                <p>{formatCurrency(event.coach_price)}</p>
              </div>
            )}
            {event.photos_enabled && (
              <div>
                <p className="text-sm text-gray-600">Photos</p>
                <p>{formatCurrency(event.photos_price)}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {event.event_details && (
        <section className="space-y-2">
          <h4 className="font-medium text-gray-700">Additional Details</h4>
          <p className="text-sm whitespace-pre-wrap">{event.event_details}</p>
        </section>
      )}

      {event.spectator_info && (
        <section className="space-y-2">
          <h4 className="font-medium text-gray-700">Spectator Information</h4>
          <p className="text-sm whitespace-pre-wrap">{event.spectator_info}</p>
        </section>
      )}

      <section className="space-y-2">
        <h4 className="font-medium text-gray-700">Contact Information</h4>
        <p>Email: {event.email}</p>
        {event.promoterEmail && <p>Promoter: {event.promoterEmail}</p>}
      </section>

      {(event.registration_link || event.matches_link || event.ticket_link) && (
        <section className="space-y-2">
          <h4 className="font-medium text-gray-700">Links</h4>
          {event.registration_link && (
            <p><a href={event.registration_link} className="text-blue-600 hover:underline">Registration</a></p>
          )}
          {event.matches_link && (
            <p><a href={event.matches_link} className="text-blue-600 hover:underline">Matches</a></p>
          )}
          {event.ticket_link && (
            <p><a href={event.ticket_link} className="text-blue-600 hover:underline">Tickets</a></p>
          )}
        </section>
      )}
    </div>
  );
};

export default EventOptions;