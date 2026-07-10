export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { htmlContent, subject, testMode } = req.body;
  if (!htmlContent) {
    return res.status(400).json({ error: 'Contenu manquant' });
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'anto60@live.fr';
  const senderName = process.env.BREVO_SENDER_NAME || 'J&L Associés – Newsletter Bailleurs';
  const emailSubject = subject || `Votre rendez-vous bailleur – ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;

  try {
    if (testMode) {
      // Mode test : envoi individuel aux 3 adresses de test
      const testRecipients = [
        'anto.caron39@gmail.com',
        'jessica.beauvillain@century21.fr',
        'nicollet.audrey@gmail.com'
      ];

      const results = [];
      for (const email of testRecipients) {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email }],
            subject: `[TEST] ${emailSubject}`,
            htmlContent
          })
        });
        const data = await response.json();
        results.push({ email, success: response.ok, error: data.message });
      }

      return res.status(200).json({
        success: true,
        mode: 'test',
        sent: results.filter(r => r.success).length,
        results
      });

    } else {
      // Mode production : envoi via la liste Brevo #2 (Liste Bailleurs C21)
      const response = await fetch('https://api.brevo.com/v3/emailCampaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          name: `Newsletter Bailleurs – ${emailSubject}`,
          subject: emailSubject,
          sender: { name: senderName, email: senderEmail },
          type: 'classic',
          htmlContent,
          recipients: { listIds: [2] },
          scheduledAt: new Date(Date.now() + 60000).toISOString() // Dans 1 minute
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data.message || 'Erreur Brevo' });
      }

      // Lancer l'envoi immédiatement
      const sendResponse = await fetch(`https://api.brevo.com/v3/emailCampaigns/${data.id}/sendNow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
        }
      });

      return res.status(200).json({
        success: true,
        mode: 'production',
        campaignId: data.id,
        recipients: 221
      });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
