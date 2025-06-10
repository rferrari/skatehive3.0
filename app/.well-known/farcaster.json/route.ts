export async function GET() {
  // Hard-code the app URL to match the domain in the account association payload
  const appUrl = 'https://my.skatehive.app';

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjIwNzIxLCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4MzVmNzA2QjY5NGFjZjllNjYxMGM3NjhiMjFDRjdiNWI4QWZhMzQ3RSJ9",
      payload: "eyJkb21haW4iOiJteS5za2F0ZWhpdmUuYXBwIn0",
      signature: "MHg1MDcxYTNmZDFmMjhiMDEwY2JhYzRhM2FmNGU1NmUxZGFkYjYxMmI3OGM0OGNlMWUxZDMyN2M5YTU0ZWIxYmJkNDFkYmFhZTRhMzAyMmFmYTgyMjA5ZDY4OWUxM2JkMzU1YTU2MmUxNTkwMjUyNWFlMzI5OWRmMmZkYjdkOGQwOTFj"
    },

    frame: {
      version: '1',
      name: 'SkateHive 3.0',
      buttonTitle: 'Open post',
      homeUrl: appUrl,
      imageUrl: `${appUrl}/opengraph-image.png`,
      webhookUrl: `${appUrl}/api/webhook`,
      iconUrl: `https://ipfs.skatehive.app/ipfs/QmXTZqirogp735AaPFcpzAjmwS57mPYsJhktJMuRuSV5Rm`,
      splashImageUrl: `https://ipfs.skatehive.app/ipfs/QmXTZqirogp735AaPFcpzAjmwS57mPYsJhktJMuRuSV5Rm`,
      splashBackgroundColor: '#000000',
    },
  };

  return Response.json(config);
}