// app/api/fighters/searchFighters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db as techboutsDb } from '@/lib/firebase_techbouts/config';
import { FullContactFighter } from '@/utils/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const termsParam = searchParams.get('terms') || '';
    
    // Parse search terms
    const terms = termsParam.split(',').filter(term => term.trim().length > 0);
    
    if (terms.length === 0) {
      return NextResponse.json({ fighters: [], total: 0 });
    }
    
    const fightersRef = collection(techboutsDb, 'techbouts_fighters');
    
    // For Firestore, we can't easily do complex text search directly in the query
    // So we'll get a reasonable number of fighters and filter in memory
    // In a production app, you might consider Algolia or a similar search service
    const searchQuery = query(
      fightersRef,
      limit(1000) // Limit to prevent excessive data transfer
    );
    
    const searchSnapshot = await getDocs(searchQuery);
    
    // Map and filter the fighters data
    const allFighters = searchSnapshot.docs.map(doc => {
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
      } as unknown as FullContactFighter;
    });
    
    // Filter fighters based on search terms
    const searchTermsLower = terms.map(term => term.toLowerCase());
    const filteredFighters = allFighters.filter(fighter => {
      const searchableText = `
        ${fighter.first?.toLowerCase() || ''} 
        ${fighter.last?.toLowerCase() || ''} 
        ${fighter.gym?.toLowerCase() || ''}
        ${fighter.email?.toLowerCase() || ''}
      `;
      
      return searchTermsLower.every(term => searchableText.includes(term));
    });
    
    return NextResponse.json({
      fighters: filteredFighters,
      total: filteredFighters.length
    });
  } catch (error) {
    console.error('Error searching fighters:', error);
    return NextResponse.json(
      { error: 'Failed to search fighters' },
      { status: 500 }
    );
  }
}