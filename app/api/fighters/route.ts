// app/api/fighters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, limit, startAfter, orderBy, getCountFromServer, getDoc, doc } from 'firebase/firestore';
import { db as techboutsDb } from '@/lib/firebase_techbouts/config';
import { FullContactFighter } from '@/utils/types';

const ITEMS_PER_PAGE = 50;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageSize = parseInt(searchParams.get('pageSize') || ITEMS_PER_PAGE.toString());
    const lastDocId = searchParams.get('lastDocId') || null;
    const countOnly = searchParams.get('countOnly') === 'true';
    
    // If we only need the count, return it without fetching all fighters
    if (countOnly) {
      const fightersRef = collection(techboutsDb, 'techbouts_fighters');
      const countSnapshot = await getCountFromServer(fightersRef);
      return NextResponse.json({ count: countSnapshot.data().count });
    }
    
    // Build the base query
    const fightersRef = collection(techboutsDb, 'techbouts_fighters');
    let fightersQuery = query(
      fightersRef,
      orderBy('last'), // Ensure you have an index for this field
      limit(pageSize)
    );
    
    // If we have a lastDocId, use it for cursor-based pagination
    if (lastDocId) {
      try {
        const lastDocRef = doc(techboutsDb, 'techbouts_fighters', lastDocId);
        const lastDocSnap = await getDoc(lastDocRef);
        
        if (lastDocSnap.exists()) {
          fightersQuery = query(
            fightersRef,
            orderBy('last'),
            startAfter(lastDocSnap),
            limit(pageSize)
          );
        }
      } catch (error) {
        console.error('Error getting lastDoc:', error);
        // Continue with non-paginated query if there's an error
      }
    }
    
    const fightersSnapshot = await getDocs(fightersQuery);
    
    // Get the last document for cursor-based pagination
    const lastVisible = fightersSnapshot.docs[fightersSnapshot.docs.length - 1];
    const nextLastDocId = lastVisible ? lastVisible.id : null;
    
    // Map the fighters data
    const fighters = fightersSnapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        fighter_id: data.fighter_id || doc.id,
        first: data.first || '',
        last: data.last || '',
        gym: data.gym || '',
        email: data.email || '',
        weightclass: Number(data.weightclass) || 0,
        // Split age_gender into age and gender if needed
        age: data.age || (data.age_gender ? data.age_gender.split('/')[0] : ''),
        gender: data.gender || (data.age_gender ? data.age_gender.split('/')[1] : ''),
        mt_win: data.win || 0,
        mt_loss: data.loss || 0,
        boxing_win: data.boxing_win || 0,
        boxing_loss: data.boxing_loss || 0,
        mma_win: data.mmawin || 0,
        mma_loss: data.mmaloss || 0,
        photo: data.photo || '',
        state: data.state || '',
        nc: data.nc || 0,
        dq: data.dq || 0,
        years_exp: data.years_exp || 0,
        class: data.class || '',
        docId: doc.id,
      } as FullContactFighter;
    });
    
    return NextResponse.json({
      fighters,
      pagination: {
        hasMore: fightersSnapshot.docs.length === pageSize,
        nextLastDocId,
        pageSize,
      }
    });
    
  } catch (error) {
    console.error('Error fetching fighters:', error);
    return NextResponse.json({ error: 'Failed to fetch fighters' }, { status: 500 });
  }
}

// Endpoint for the search function
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { terms } = body;
    
    if (!terms || !Array.isArray(terms) || terms.length === 0) {
      return NextResponse.json({ error: 'Invalid search terms' }, { status: 400 });
    }
    
    // For search, we'll need to get more fighters to ensure good results
    // In a production environment, you might consider using Algolia, Elasticsearch, 
    // or Firestore's native search capabilities with proper indexing
    const fightersRef = collection(techboutsDb, 'techbouts_fighters');
    const fightersQuery = query(fightersRef, limit(1000)); // Limit to prevent excessive data transfer
    const fightersSnapshot = await getDocs(fightersQuery);
    
    const fighters = fightersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        fighter_id: data.fighter_id || doc.id,
        first: data.first || '',
        last: data.last || '',
        gym: data.gym || '',
        email: data.email || '',
        weightclass: Number(data.weightclass) || 0,
        age: data.age || (data.age_gender ? data.age_gender.split('/')[0] : ''),
        gender: data.gender || (data.age_gender ? data.age_gender.split('/')[1] : ''),
        mt_win: data.win || 0,
        mt_loss: data.loss || 0,
        boxing_win: data.boxing_win || 0,
        boxing_loss: data.boxing_loss || 0,
        mma_win: data.mmawin || 0,
        mma_loss: data.mmaloss || 0,
        photo: data.photo || '',
        state: data.state || '',
        nc: data.nc || 0,
        dq: data.dq || 0,
        years_exp: data.years_exp || 0,
        class: data.class || '',
        docId: doc.id,
      } as FullContactFighter;
    });
    
    // Filter fighters based on search terms
    const searchTermsLower = terms.map(term => term.toLowerCase());
    const filteredFighters = fighters.filter(fighter => {
      const searchableText = `
        ${fighter.first?.toLowerCase() || ''} 
        ${fighter.last?.toLowerCase() || ''} 
        ${fighter.gym?.toLowerCase() || ''}
        ${fighter.email?.toLowerCase() || ''}
        ${fighter.class?.toLowerCase() || ''}
      `;
      
      return searchTermsLower.every(term => searchableText.includes(term));
    });
    
    return NextResponse.json({
      fighters: filteredFighters,
      total: filteredFighters.length
    });
    
  } catch (error) {
    console.error('Error searching fighters:', error);
    return NextResponse.json({ error: 'Failed to search fighters' }, { status: 500 });
  }
}