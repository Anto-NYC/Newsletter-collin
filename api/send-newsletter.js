export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { htmlContent, subject, recipients } = req.body;
  if (!htmlContent || !recipients || !recipients.length) {
    return res.status(400).json({ error: 'Donnees manquantes' });
  }

  try {
    // Envoi individuel à chaque destinataire pour préserver la confidentialité (RGPD)
    const results = [];
    for (const email of recipients) {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: {
            name: 'J&L Associés – Newsletter Bailleurs',
            email: 'anto60@live.fr'
          },
          to: [{ email }],
          subject: subject || `Votre rendez-vous bailleur – ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
          htmlContent: htmlContent
        })
      });

      const data = await response.json();
      results.push({ email, success: response.ok, messageId: data.messageId, error: data.message });
    }

    const allOk = results.every(r => r.success);
    return res.status(200).json({ 
      success: allOk, 
      results,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
