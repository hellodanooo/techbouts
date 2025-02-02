import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const headersList = await headers();
    const fullUrl = headersList.get('x-url') || '';

    const response = await fetch(fullUrl);
    const html = await response.text();
    
    const $ = cheerio.load(html);
    const content: Array<{ type: string; content: string; hasLinks?: boolean }> = [];

    // Extract paragraphs <p>
    $('p').each((_, element) => {
        const text = $(element).text().trim();
        if (text) {
            content.push({
                type: 'p',
                content: text,
                hasLinks: $(element).find('a').length > 0
            });
        }
    });

    // Extract unordered lists <ul>
    $('ul').each((_, element) => {
        const listContent = $(element).html()?.trim() || '';
        if (listContent) {
            content.push({
                type: 'ul',
                content: listContent,
                hasLinks: $(element).find('a').length > 0
            });
        }
    });

    // Extract ordered lists <ol> (Fight Results)
    $('ol').each((_, element) => {
        const fightResults: string[] = [];

        $(element).find('li').each((_, li) => {
            const listItem = $(li).html()?.trim() || '';
            if (listItem) {
                fightResults.push(listItem);
            }
        });

        if (fightResults.length > 0) {
            content.push({
                type: 'ol',
                content: fightResults.join("\n"), // Combine <li> elements for clarity
                hasLinks: $(element).find('a').length > 0
            });
        }
    });

    // Extract images
    const images: Array<{ src: string; alt: string }> = [];
    $('img').each((_, element) => {
        const src = $(element).attr('src') || '';
        const alt = $(element).attr('alt') || '';
        if (src) {
            images.push({ src, alt });
        }
    });

    // Extract fighter matchups from the scraped content
    $('b').each((_, element) => {
        const text = $(element).text().trim();

        // Check if this is a fight matchup (contains "VS")
        if (text.includes('VS')) {
            const previous = $(element).prev().text().trim();
            const next = $(element).next().text().trim();
            const resultText = $(element).nextAll('b:contains("Winner")').text().trim();

            const fighterDetails = previous.match(/(.+?) \((.+?)\)/);
            const opponentDetails = next.match(/(.+?) \((.+?)\)/);
            const winnerDetails = resultText.match(/Winner:\s*(.+)/);

            if (fighterDetails && opponentDetails) {
                const fighter = fighterDetails[1].trim();
                const opponent = opponentDetails[1].trim();
                const fighterInfo = fighterDetails[2] || "";
                // Removed `opponentInfo` since it's unused
                const winner = winnerDetails ? winnerDetails[1].trim() : "Unknown";

                // Extract DOB (assuming it's in MM-DD-YYYY format inside parentheses)
                const dobMatch = fighterInfo.match(/(\d{1,2}-\d{1,2}-\d{4})/);
                const fighterDOB = dobMatch ? dobMatch[0].replace(/-/g, '') : "00000000";

                const fight = {
                    first: fighter.split(" ")[0],
                    last: fighter.split(" ")[1] || "",
                    opponent_name: opponent,
                    result: winner === fighter ? "Win" : "Loss",
                    city: "",
                    state: "",
                    dob: fighterDOB,
                    gym: "",
                    coach: "",
                    coach_phone: "",
                    fighter_id: `${fighter.split(" ")[0]}${fighter.split(" ")[1] || ""}${fighterDOB}`
                };

                content.push({
                    type: 'fight',
                    content: JSON.stringify(fight)
                });
            }
        }
    });

    return NextResponse.json({
      status: 'success',
      data: {
        content,
        images,
        totalElements: content.length
      }
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape content' },
      { status: 500 }
    );
  }
}
