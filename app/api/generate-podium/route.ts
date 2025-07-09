import { NextRequest, NextResponse } from 'next/server';

function generateMatrixBackground(width: number, height: number): string {
  const chars = "01"; // Using binary for a classic matrix feel
  let matrixChars = '';
  const fontSize = 14;
  const columns = Math.floor(width / fontSize);

  for (let i = 0; i < columns; i++) {
    const x = i * fontSize;
    const streamLength = Math.floor(Math.random() * (height / fontSize / 2)) + 5;
    const startY = Math.random() * height * 1.5 - height * 0.5; // Start some streams off-screen

    for (let j = 0; j < streamLength; j++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const y = startY + j * fontSize;

      if (y > 0 && y < height) {
        // The first character in a stream is brighter
        const fill = j === 0 ? "#aaffaa" : "#00ff00";
        const opacity = 1 - (j / streamLength) * 0.7;
        matrixChars += `<text x="${x}" y="${y}" font-family="monospace" font-size="${fontSize}" fill="${fill}" opacity="${opacity}">${char}</text>`;
      }
    }
  }
  return matrixChars;
}

function generateCircuitTraces(width: number, height: number, count: number): string {
  let traces = '';
  const traceColor = "#00ff00";
  const traceOpacity = 0.3;

  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    let pathData = `M ${x} ${y}`;
    const numSegments = Math.floor(Math.random() * 8) + 5;
    let isHorizontal = Math.random() > 0.5;

    for (let j = 0; j < numSegments; j++) {
      const length = Math.random() * 50 + 10;
      if (isHorizontal) {
        pathData += ` h ${Math.random() > 0.5 ? length : -length}`;
      } else {
        pathData += ` v ${Math.random() > 0.5 ? length : -length}`;
      }
      isHorizontal = !isHorizontal;
    }
    traces += `<path d="${pathData}" stroke="${traceColor}" stroke-width="${Math.random() * 2 + 1}" fill="none" opacity="${traceOpacity}" />`;

    if (Math.random() > 0.5) {
      traces += `<rect x="${x - 2}" y="${y - 2}" width="4" height="4" fill="${traceColor}" opacity="${traceOpacity}" />`;
    }
  }

  return traces;
}

function createServerPodium(x: number, y: number, width: number, height: number, rank: number): string {
  const baseColors = ['#2d825b', '#3498db', '#c0392b'];
  const lightColors = ['#38a873', '#5dade2', '#e74c3c'];
  const darkColors = ['#226144', '#217dbb', '#962d22'];

  const podiumColor = baseColors[rank - 1] || baseColors[0];
  const lightColor = lightColors[rank - 1] || lightColors[0];
  const darkColor = darkColors[rank - 1] || darkColors[0];

  const detailColor = '#ecf0f1';
  const darkDetailColor = '#333';
  const d = 20; // perspective offset

  let server = '';

  // Draw the 3D faces first
  // Side face
  server += `<polygon points="${x + width},${y} ${x + width + d},${y - d} ${x + width + d},${y + height - d} ${x + width},${y + height}" fill="${darkColor}" stroke="#111" stroke-width="1"/>`;

  // Top face
  server += `<polygon points="${x},${y} ${x + d},${y - d} ${x + width + d},${y - d} ${x + width},${y}" fill="${lightColor}" stroke="#111" stroke-width="1"/>`;

  // Front face
  server += `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${podiumColor}" stroke="#111" stroke-width="1"/>`;

  // Details are drawn on top of the front face
  const slotHeight = 4;
  const numSlots = Math.floor(height / 40);
  for (let i = 0; i < numSlots; i++) {
    const slotY = y + 30 + (i * 20);
    if (slotY < y + height - 30) {
      server += `<rect x="${x + 10}" y="${slotY}" width="${width - 20}" height="${slotHeight}" fill="${darkDetailColor}" rx="1" />`;
    }
  }

  const contactHeight = 8;
  const contactWidth = 4;
  const numContacts = Math.floor((width - 20) / (contactWidth + 4));
  const startX = x + (width - (numContacts * (contactWidth + 4)) + 4) / 2;
  const contactY = y + height - 20;

  for (let i = 0; i < numContacts; i++) {
    server += `<rect x="${startX + i * (contactWidth + 4)}" y="${contactY}" width="${contactWidth}" height="${contactHeight}" fill="${detailColor}" />`;
  }

  const lightSize = 10;
  const lightX = x + 15;
  const lightY = y + 15;
  server += `<rect x="${lightX}" y="${lightY}" width="${lightSize}" height="${lightSize}" fill="#ff0" stroke="black" stroke-width="1" />`;

  server += `<circle cx="${x + width - 20}" cy="${y + 18}" r="3" fill="#e74c3c" />`;
  server += `<circle cx="${x + width - 35}" cy="${y + 18}" r="3" fill="#2ecc71" />`;

  return server;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const avatars = searchParams.get('avatars')?.split(',') || [];
  const names = searchParams.get('names')?.split(',') || [];

  try {
    const width = 1200;
    const height = 630;
    const matrixBg = generateMatrixBackground(width, height);
    const circuitTraces = generateCircuitTraces(width, height, 30);

    // Create SVG podium image
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="black"/>
        
        <!-- Circuit Board Traces -->
        <g>
          ${circuitTraces}
        </g>

        <!-- Matrix Background -->
        <g opacity="0.4">
          ${matrixBg}
        </g>
        
        <!-- Title -->
        <text x="600" y="80" font-family="monospace" font-size="48" font-weight="bold" text-anchor="middle" fill="#00ff00">
          🛹 SKATEHIVE LEADERBOARD 🛹
        </text>
        
        <!-- Podium -->
        ${createServerPodium(525, 300, 150, 250, 1)}
        ${createServerPodium(325, 400, 150, 150, 2)}
        ${createServerPodium(725, 450, 150, 100, 3)}
        
        <!-- Avatar Placeholders and Names -->
        ${avatars[1] && names[1] ? `
          <image href="${avatars[1]}" x="360" y="300" height="80" width="80" />
          <text x="400" y="435" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle" fill="white">${names[1]}</text>
        ` : ''}
        
        ${avatars[0] && names[0] ? `
          <image href="${avatars[0]}" x="550" y="200" height="100" width="100" />
          <text x="600" y="335" font-family="monospace" font-size="18" font-weight="bold" text-anchor="middle" fill="white">${names[0]}</text>
        ` : ''}
        
        ${avatars[2] && names[2] ? `
          <image href="${avatars[2]}" x="765" y="350" height="70" width="70" />
          <text x="800" y="485" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle" fill="white">${names[2]}</text>
        ` : ''}
        
        <!-- Crown for 1st place -->
        ${names[0] ? `<text x="600" y="190" font-family="monospace" font-size="40" text-anchor="middle">👑</text>` : ''}
        
        <!-- Decorative elements -->
        <text x="100" y="200" font-family="monospace" font-size="60" fill="#00ff00" opacity="0.3">🏆</text>
        <text x="1000" y="200" font-family="monospace" font-size="60" fill="#00ff00" opacity="0.3">🏆</text>
        
        <!-- Bottom text -->
        <text x="600" y="620" font-family="monospace" font-size="16" text-anchor="middle" fill="#00ff00" opacity="0.7">
          my.skatehive.app/leaderboard
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
