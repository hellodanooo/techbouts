import {
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    query,
    orderBy,
    limit,
    startAfter,
    where,
    DocumentSnapshot,
    Query,
    DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase_pmt/config';

interface FighterEmail {
    pmt_id: string;
    first: string;
    last: string;
    email: string;
}

/**
 * Fetches all fighter emails for the given year and stores them in emails_pmt_{year}
 * collection as a JSON document.
 *
 * @param selectedYear - The year to process (e.g. "2023")
 * @param progressCallback - (Optional) callback to report progress messages
 */
export async function exportEmails(
    selectedYear: string,
    progressCallback?: (message: string) => void
) {
    const BATCH_SIZE = 500;
    const fighterEmails = new Map<string, FighterEmail>();
    let lastEventDoc: DocumentSnapshot | null = null;

    try {
        while (true) {
            // Build query to retrieve events within selected year
            const eventsQuery: Query<DocumentData> = lastEventDoc
                ? query(
                    collection(db, 'events'),
                    where('date', '>=', `${selectedYear}-01-01`),
                    where('date', '<=', `${selectedYear}-12-31`),
                    orderBy('date', 'desc'),
                    startAfter(lastEventDoc),
                    limit(BATCH_SIZE)
                )
                : query(
                    collection(db, 'events'),
                    where('date', '>=', `${selectedYear}-01-01`),
                    where('date', '<=', `${selectedYear}-12-31`),
                    orderBy('date', 'desc'),
                    limit(BATCH_SIZE)
                );

            const eventsSnapshot = await getDocs(eventsQuery);
            if (eventsSnapshot.empty) break;
            lastEventDoc = eventsSnapshot.docs[eventsSnapshot.docs.length - 1];

            for (const eventDoc of eventsSnapshot.docs) {
                progressCallback?.(`Processing event: ${eventDoc.data().event_name}`);
                const resultsJsonRef = doc(db, 'events', eventDoc.id, 'resultsJson', 'fighters');
                const resultsJsonSnap = await getDoc(resultsJsonRef);
                if (!resultsJsonSnap.exists()) continue;
                
                const resultsData = resultsJsonSnap.data();
                const fighters = resultsData.fighters as Array<{
                    pmt_id: string;
                    first: string;
                    last: string;
                    email: string;
                }>;

                fighters.forEach((fighter) => {
                    if (fighter.email && !fighterEmails.has(fighter.pmt_id)) {
                        fighterEmails.set(fighter.pmt_id, {
                            pmt_id: fighter.pmt_id,
                            first: fighter.first.toUpperCase(),
                            last: fighter.last.toUpperCase(),
                            email: fighter.email.toLowerCase(),
                        });
                    }
                });
            }
            progressCallback?.(`Processed batch of ${eventsSnapshot.size} events`);
        }

        // Convert Map to array and sort by last name
        const emailsArray = Array.from(fighterEmails.values())
            .sort((a, b) => a.last.localeCompare(b.last));

        // Store the emails JSON in Firestore using setDoc
        const emailsJsonRef = doc(db, `emails_pmt_${selectedYear}`, 'emails_json');
        await setDoc(emailsJsonRef, {
            emails: emailsArray,
            totalEmails: emailsArray.length,
            lastUpdated: new Date().toISOString()
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