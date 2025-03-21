// utils/pmt/addMergePmtOneEvent.ts

// THE EVENTS ARE NOT BEING SAVED IN FIREBASE


import { 
    collection, 
    getDocs, 
    doc, 
    writeBatch, 
    query, 
    limit, 
    where, 
    Firestore,
    getDoc,
    setDoc,
} from 'firebase/firestore';

import { FighterRecord, ProcessedEvent } from './calculateRecordsAll';

/**
 * Saves or merges a single event's fighter records into the TechBouts database.
 * @param techboutsDb - Firestore instance for TechBouts database.
 * @param eventRecord - The processed fighter records from a single event.
 * @param processedEvent - The metadata of the processed event.
 * @param progressCallback - Optional callback to report progress messages.
 */
export async function saveOneEventRecord(
    techboutsDb: Firestore,
    eventRecord: Map<string, FighterRecord>,
    processedEvent: ProcessedEvent,
    progressCallback?: (message: string) => void
): Promise<{ success: boolean; updated: number; created: number; message: string }> {
    let batch = writeBatch(techboutsDb);
    let operationCount = 0;
    let updatedCount = 0;
    let createdCount = 0;

    try {
        progressCallback?.(`Starting to save event records for ${processedEvent.eventName}...`);
        const eventRecordsArray = Array.from(eventRecord.entries());

        for (let i = 0; i < eventRecordsArray.length; i++) {
            const [pmtId, record] = eventRecordsArray[i];

            // Search for the fighter by `pmt_id`
            const fighterQuery = query(
                collection(techboutsDb, 'techbouts_fighters'),
                where('pmt_id', '==', pmtId),
                limit(1)
            );

            let fighterSnapshot = await getDocs(fighterQuery);

            if (!fighterSnapshot.empty) {
                // Fighter exists, update their record
                const fighterDoc = fighterSnapshot.docs[0];

                batch.update(doc(techboutsDb, 'techbouts_fighters', fighterDoc.id), {
                    pmt_win: record.wins,
                    pmt_loss: record.losses,
                    pmt_nc: record.nc,
                    pmt_dq: record.dq,
                    pmt_bodykick: record.bodykick,
                    pmt_boxing: record.boxing,
                    pmt_clinch: record.clinch,
                    pmt_defense: record.defense,
                    pmt_footwork: record.footwork,
                    pmt_headkick: record.headkick,
                    pmt_kicks: record.kicks,
                    pmt_knees: record.knees,
                    pmt_legkick: record.legkick,
                    pmt_ringawareness: record.ringawareness,
                    pmt_weightclasses: record.weightclasses,
                    pmt_fights: record.fights,
                    pmt_lastUpdated: record.lastUpdated,
                    updated_at: new Date().toISOString(),
                });

                updatedCount++;
            } else {
                // Fighter does not exist, create a new record
                batch.set(doc(techboutsDb, 'techbouts_fighters', pmtId), {
                    first: record.first,
                    last: record.last,
                    gym: record.gym,
                    pmt_id: pmtId,
                    email: record.email || '',
                    gender: record.gender || '',
                    pmt_win: record.wins,
                    pmt_loss: record.losses,
                    pmt_nc: record.nc,
                    pmt_dq: record.dq,
                    pmt_bodykick: record.bodykick,
                    pmt_boxing: record.boxing,
                    pmt_clinch: record.clinch,
                    pmt_defense: record.defense,
                    pmt_footwork: record.footwork,
                    pmt_headkick: record.headkick,
                    pmt_kicks: record.kicks,
                    pmt_knees: record.knees,
                    pmt_legkick: record.legkick,
                    pmt_ringawareness: record.ringawareness,
                    pmt_weightclasses: record.weightclasses,
                    pmt_fights: record.fights,
                    pmt_lastUpdated: record.lastUpdated,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });

                createdCount++;
            }

            operationCount++;

            // Commit in batches
            if (operationCount >= 500) {
                progressCallback?.(`Committing batch of ${operationCount} updates...`);
                await batch.commit();
                batch = writeBatch(techboutsDb);
                operationCount = 0;
            }
        }

        // Commit any remaining operations
        if (operationCount > 0) {
            progressCallback?.(`Committing final batch of ${operationCount} updates...`);
            await batch.commit();
        }

        // Fetch the existing processed events
        const eventsDocRef = doc(techboutsDb, 'system_metadata', 'processedPmtEventsJson');
        const eventsDocSnap = await getDoc(eventsDocRef);
        let existingEvents: ProcessedEvent[] = [];

        if (eventsDocSnap.exists()) {
            const data = eventsDocSnap.data();
            existingEvents = data.events || [];
        }

        // Avoid adding duplicate events
        const eventExists = existingEvents.some(event => event.eventId === processedEvent.eventId);

        if (!eventExists) {
            existingEvents.push(processedEvent);

            // Save the updated processed events list
            await setDoc(eventsDocRef, {
                events: existingEvents,
                lastUpdated: new Date().toISOString(),
            });

            progressCallback?.(`Successfully added event ${processedEvent.eventName} to processed list.`);
        } else {
            progressCallback?.(`Event ${processedEvent.eventName} already exists in the processed list.`);
        }

        return {
            success: true,
            updated: updatedCount,
            created: createdCount,
            message: `Successfully processed ${updatedCount + createdCount} fighters. Updated: ${updatedCount}, Created: ${createdCount}`,
        };
    } catch (error) {
        console.error('Error saving one event record:', error);
        return {
            success: false,
            updated: updatedCount,
            created: createdCount,
            message: `Error processing event ${processedEvent.eventName}: ${error}`,
        };
    }
}
