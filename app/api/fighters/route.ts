// app/api/fighters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, limit, startAfter, orderBy, doc, getDoc } from 'firebase/firestore';
import { db as techboutsDb } from '@/lib/firebase_techbouts/config';
import { FullContactFighter } from '@/utils/types';

const ITEMS_PER_PAGE = 50;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || ITEMS_PER_PAGE.toString());
    const lastDocId = searchParams.get('lastDocId') || null;
    const searchTerms = searchParams.get('terms')?.split(',') || [];
    
    // Build the base query
    const fightersRef = collection(techboutsDb, 'techbouts_fighters');
    let fightersQuery = query(
      fightersRef,
      orderBy('last'),
      limit(pageSize)
    );
    
    // If we have a lastDocId, use it for pagination
    if (lastDocId) {
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
    }
    
    const fightersSnapshot = await getDocs(fightersQuery);
    
    // Get the last document ID for cursor-based pagination
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
        age_gender: data.age_gender || '',
        mt_win: data.win || 0,
        mt_loss: data.loss || 0,
        boxing_win: data.boxing_win || 0,
        boxing_loss: data.boxing_loss || 0,
        mma_win: data.mmawin || 0,
        mma_loss: data.mmaloss || 0,
        nc: data.nc || 0,
        dq: data.dq || 0,
        years_exp: data.years_exp || 0,
        class: data.class || '',
        docId: doc.id,
      } as FullContactFighter;
    });
    
    // If search terms are provided, filter the results
    let filteredFighters = fighters;
    if (searchTerms.length > 0) {
      filteredFighters = fighters.filter(fighter => {
        const searchableFields = [
          fighter.first?.toLowerCase(),
          fighter.last?.toLowerCase(),
          fighter.gym?.toLowerCase(),
          fighter.email?.toLowerCase(),
          fighter.class?.toLowerCase(),
        ].filter(Boolean);
        
        return searchTerms.every(term => 
          searchableFields.some(field => field.includes(term.toLowerCase()))
        );
      });
    }
    
    return NextResponse.json({
      fighters: filteredFighters,
      pagination: {
        hasMore: fightersSnapshot.docs.length === pageSize,
        nextLastDocId,
        currentPage: page,
        pageSize,
        totalFighters: filteredFighters.length,
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
    
    // Get all fighters - we'll filter in memory for search
    // For large datasets, you might want to implement a more sophisticated search solution
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
        age_gender: data.age_gender || '',
        mt_win: data.win || 0,
        mt_loss: data.loss || 0,
        boxing_win: data.boxing_win || 0,
        boxing_loss: data.boxing_loss || 0,
        mma_win: data.mmawin || 0,
        mma_loss: data.mmaloss || 0,
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