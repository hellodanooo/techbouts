import {
    doc,
    setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';
import { User } from 'firebase/auth';


interface FighterEmail {
    pmt_id: string;
    first: string;
    last: string;
    email: string;
}

interface ExportEmailsOptions {
    user: User | null;
    isAdmin: boolean;
}

interface FirestoreResponse {
    documents: Array<{
        fields: {
            fighters: {
                arrayValue: {
                    values: Array<{
                        mapValue: {
                            fields: {
                                pmt_id: { stringValue: string };
                                first: { stringValue: string };
                                last: { stringValue: string };
                                email: { stringValue: string };
                            }
                        }
                    }>
                }
            }
        }
    }>
}

/**
 * Fetches all fighter emails for the given year using REST API and stores them in techbouts firestore
 *
 * @param selectedYear - The year to process (e.g. "2023")
 * @param progressCallback - (Optional) callback to report progress messages
 */
export async function exportEmails(
    selectedYear: string,
    authOptions: ExportEmailsOptions,
    progressCallback?: (message: string) => void
) {

    if (!authOptions.user || !authOptions.isAdmin) {
        throw new Error('Unauthorized: Requires admin access');
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PMT;
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY_PMT;
    const fighterEmails = new Map<string, FighterEmail>();
let fighterEmailsLength = 0;
    try {
        // First, fetch all events for the selected year using structured query
        const eventsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;
        
        const queryBody = {
            structuredQuery: {
                from: [{ collectionId: 'events' }],
                where: {
                    compositeFilter: {
                        op: 'AND',
                        filters: [
                            {
                                fieldFilter: {
                                    field: { fieldPath: 'date' },
                                    op: 'GREATER_THAN_OR_EQUAL',
                                    value: { stringValue: `${selectedYear}-01-01` }
                                }
                            },
                            {
                                fieldFilter: {
                                    field: { fieldPath: 'date' },
                                    op: 'LESS_THAN_OR_EQUAL',
                                    value: { stringValue: `${selectedYear}-12-31` }
                                }
                            }
                        ]
                    }
                },
                orderBy: [{ field: { fieldPath: 'date' }, direction: 'DESCENDING' }],
                limit: 1000
            }
        };
        
        const eventsResponse = await fetch(eventsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(queryBody)
        });

        if (!eventsResponse.ok) {
            throw new Error(`Failed to fetch events: ${eventsResponse.statusText}`);
        }
        
        const eventsData = await eventsResponse.json();
        
        // Process each event
        for (const eventDoc of eventsData) {
            if (!eventDoc.document) continue;

            const docPath = eventDoc.document.name;
            const eventId = docPath.split('/').pop(); // Gets the last segment which is the docId
            const eventName = eventDoc.document.fields?.event_name?.stringValue || eventId;

            progressCallback?.(`Processing event: ${eventName} with eventId: ${eventId}`);

            // Fetch fighters data for this event
            const fightersUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/events/${eventId}/resultsJson/fighters?key=${apiKey}`;
            
            const fightersResponse = await fetch(fightersUrl);
            if (!fightersResponse.ok) continue;
            
            const fightersData = await fightersResponse.json();
            const fighters = fightersData?.fields?.fighters?.arrayValue?.values || [];
            
            let eventEmailCount = 0; // Count emails in this event
            const previousTotalEmails = fighterEmails.size;

            fighters.forEach((fighter: any) => {
                const fields = fighter.mapValue.fields;
                const pmt_id = fields.pmt_id?.stringValue;
                const email = fields.email?.stringValue;
                
                if (email && email.trim() !== '') { // Only count non-empty emails
                    eventEmailCount++;
                    if (pmt_id && !fighterEmails.has(pmt_id)) {
                        fighterEmails.set(pmt_id, {
                            pmt_id,
                            first: fields.first.stringValue.toUpperCase(),
                            last: fields.last.stringValue.toUpperCase(),
                            email: email.toLowerCase(),
                        });
                    }
                }
            });

            const newUniqueEmails = fighterEmails.size - previousTotalEmails;
            progressCallback?.(`${eventName} - Total fighters: ${fighters.length}, Valid emails: ${eventEmailCount}, New unique emails: ${newUniqueEmails}`);
        }

        // Convert Map to array and sort by last name
        const emailsArray = Array.from(fighterEmails.values())
            .sort((a, b) => a.last.localeCompare(b.last));

        // Store the emails JSON in techbouts Firestore
        const emailsJsonRef = doc(db, 'emails_muaythaipurist', selectedYear, 'emails_json', 'data');
        await setDoc(emailsJsonRef, {
            emails: emailsArray,
            totalEmails: emailsArray.length,
            lastUpdated: new Date().toISOString(),
            updatedBy: authOptions.user.email,
            uid: authOptions.user.uid
        });

        return {
            success: true,
            totalEmails: emailsArray.length,
            message: `Successfully exported ${emailsArray.length} fighter emails for ${selectedYear}`,
        };
    } catch (error) {
        console.error('Error exporting emails:', error);
        throw error;
    }
}