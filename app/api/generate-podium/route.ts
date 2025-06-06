import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const avatars = searchParams.get('avatars')?.split(',') || [];
  const names = searchParams.get('names')?.split(',') || [];

  try {
    // Create SVG podium image
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#000000;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#1a1a1a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <!-- Title -->
        <text x="600" y="80" font-family="monospace" font-size="48" font-weight="bold" text-anchor="middle" fill="#00ff00">
          🛹 SKATEHIVE LEADERBOARD 🛹
        </text>
        
        <!-- Podium Base -->
        <!-- 2nd Place (Left) -->
        <rect x="200" y="400" width="150" height="150" fill="#C0C0C0" stroke="#00ff00" stroke-width="2"/>
        <text x="275" y="535" font-family="monospace" font-size="24" font-weight="bold" text-anchor="middle" fill="#000">2</text>
        
        <!-- 1st Place (Center) -->
        <rect x="400" y="300" width="150" height="250" fill="#FFD700" stroke="#00ff00" stroke-width="3"/>
        <text x="475" y="535" font-family="monospace" font-size="32" font-weight="bold" text-anchor="middle" fill="#000">1</text>
        
        <!-- 3rd Place (Right) -->
        <rect x="600" y="450" width="150" height="100" fill="#CD7F32" stroke="#00ff00" stroke-width="2"/>
        <text x="675" y="535" font-family="monospace" font-size="20" font-weight="bold" text-anchor="middle" fill="#000">3</text>
        
        <!-- Avatar Placeholders and Names -->
        ${names[1] ? `
          <circle cx="275" cy="340" r="40" fill="#00ff00"/>
          <text x="275" y="350" font-family="monospace" font-size="20" font-weight="bold" text-anchor="middle" fill="#000">${names[1]?.charAt(0).toUpperCase()}</text>
          <text x="275" y="580" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle" fill="#C0C0C0">${names[1]}</text>
        ` : ''}
        
        ${names[0] ? `
          <circle cx="475" cy="240" r="50" fill="#00ff00"/>
          <text x="475" y="250" font-family="monospace" font-size="24" font-weight="bold" text-anchor="middle" fill="#000">${names[0]?.charAt(0).toUpperCase()}</text>
          <text x="475" y="580" font-family="monospace" font-size="18" font-weight="bold" text-anchor="middle" fill="#FFD700">${names[0]}</text>
        ` : ''}
        
        ${names[2] ? `
          <circle cx="675" cy="390" r="35" fill="#00ff00"/>
          <text x="675" y="400" font-family="monospace" font-size="18" font-weight="bold" text-anchor="middle" fill="#000">${names[2]?.charAt(0).toUpperCase()}</text>
          <text x="675" y="580" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle" fill="#CD7F32">${names[2]}</text>
        ` : ''}
        
        <!-- Crown for 1st place -->
        ${names[0] ? `<text x="475" y="200" font-family="monospace" font-size="40" text-anchor="middle">👑</text>` : ''}
        
        <!-- Decorative elements -->
        <text x="100" y="200" font-family="monospace" font-size="60" fill="#00ff00" opacity="0.3">🏆</text>
        <text x="1000" y="200" font-family="monospace" font-size="60" fill="#00ff00" opacity="0.3">🏆</text>
        
        <!-- Bottom text -->
        <text x="600" y="620" font-family="monospace" font-size="16" text-anchor="middle" fill="#00ff00" opacity="0.7">
          skatehive.app/leaderboard
        </text>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Error generating podium image:', error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}
