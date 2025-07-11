export async function GET() {
  const appUrl =
    process.env.NEXT_PUBLIC_NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://skatehive.app';

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjIwNzIxLCJ0eXBlIjoiYXV0aCIsImtleSI6IjB4MmQxODgyMzA0YzlBNkZhN0Y5ODdDMUI0MWM5ZkQ1RThDRjA1MTZlMiJ9",
      payload: "eyJkb21haW4iOiJza2F0ZWhpdmUuYXBwIn0",
      signature: "Who5bMkXiJ0h5b9eE5R0+gipGNRkRh/szPmanokuuwIeIhMer5QFkuhEvNWRfvGOf5gPn5vMzTUtfy7lGMrm9Rw="
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