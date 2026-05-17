export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { accessToken } = req.body;

  try {
    const response = await fetch('https://api.minepi.com/v2/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const user = await response.json();
    res.status(200).json({ username: user.username });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}