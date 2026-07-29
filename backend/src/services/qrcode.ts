export const generateQrDataUrl = (data: string): string => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const qrData = `${baseUrl}/booking/verify?ref=${encodeURIComponent(data)}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="white"/>
    <g transform="translate(10,10)">
      <rect width="180" height="180" fill="white" stroke="black" stroke-width="2"/>
      <text x="90" y="30" text-anchor="middle" font-size="10" font-family="monospace">QR CODE</text>
      <text x="90" y="50" text-anchor="middle" font-size="8" font-family="monospace">Booking Ref</text>
      <text x="90" y="70" text-anchor="middle" font-size="11" font-weight="bold" font-family="monospace">${data}</text>
      <rect x="10" y="80" width="160" height="80" fill="black" rx="4"/>
      <g transform="translate(20,90)">
        ${generateQrPattern()}
      </g>
      <text x="90" y="175" text-anchor="middle" font-size="7" font-family="monospace">${baseUrl}</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

function generateQrPattern(): string {
  const cells: string[] = [];
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 12; col++) {
      if ((row + col) % 3 === 0 || (row * col) % 5 === 0) {
        cells.push(
          `<rect x="${col * 10}" y="${row * 10}" width="8" height="8" fill="white" rx="1"/>`
        );
      }
    }
  }
  return cells.join("\n        ");
}
