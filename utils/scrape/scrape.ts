// app/api/scrape/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    const response = await axios.get(url);
    const html = response.data;

    const $ = cheerio.load(html);
    const contexts: { content: string; tag: string }[] = [];

    $('body *').each((_, element) => {
      const text = $(element).text().trim();
      contexts.push({
        content: text,
        tag: element.type === 'tag' ? element.name : 'unknown'
      });
    });

    return NextResponse.json({ html, contexts });
  } catch (error) {
    console.error('Error fetching URL:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}