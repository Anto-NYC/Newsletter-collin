export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { htmlContent, subject, recipients } = req.body;
  if (!htmlContent || !recipients || !recipients.length) {
    return res.status(400).json({ error: 'Donnees manquantes' });
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: 'Century 21 – Agence Collin',
          email: 'agencecollin@century21.fr'
        },
        to: recipients.map(email => ({ email })),
        subject: subject || `Votre rendez-vous bailleur – ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
        htmlContent: htmlContent
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Erreur Brevo' });
    }

    return res.status(200).json({ success: true, messageId: data.messageId });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
