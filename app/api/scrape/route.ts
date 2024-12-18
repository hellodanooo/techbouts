// app/api/scrape/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    console.log('Attempting to scrape URL:', url);
    
    const axiosInstance = axios.create({
      httpsAgent: new https.Agent({  
        rejectUnauthorized: false
      }),
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const response = await axiosInstance.get(url);
    console.log('Response received, status:', response.status);
    const html = response.data;
    console.log('HTML content sample:', html.substring(0, 500));

    const $ = cheerio.load(html);
    const contexts: { content: string; tag: string }[] = [];

    $('body *').each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        contexts.push({
          content: text,
          tag: element.type === 'tag' ? element.name : 'unknown'
        });
      }
    });

    console.log('Found contexts:', contexts.length);
    console.log('Sample contexts:', contexts.slice(0, 3));

    return NextResponse.json({ 
      contexts,
      status: 'success'
    });
  } catch (error) {
    console.error('Error fetching URL:', error);
    
    let errorMessage = 'Failed to fetch data';
    if (axios.isAxiosError(error)) {
      errorMessage = error.message;
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Could not connect to the website';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Request timed out';
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}