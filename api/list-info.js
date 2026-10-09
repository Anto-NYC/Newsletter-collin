// Effectif reel de la liste Brevo, lu a la demande.
// L'interface n'affiche plus de nombre fige : le chiffre annonce avant un envoi
// irreversible doit etre celui de la liste au moment ou on valide.

const BREVO_LIST_ID = Number(process.env.BREVO_LIST_ID) || 3;

export default async function handler(req, res) {
  if (!process.env.BREVO_API_KEY) {
    return res.status(500).json({ error: "BREVO_API_KEY absente de la configuration Vercel" });
  }

  try {
    const response = await fetch(`https://api.brevo.com/v3/contacts/lists/${BREVO_LIST_ID}`, {
      headers: { 'api-key': process.env.BREVO_API_KEY }
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || data.code || `HTTP ${response.status}`
      });
    }

    const total = Number(data.totalSubscribers) || 0;
    const blacklisted = Number(data.totalBlacklisted) || 0;

    return res.status(200).json({
      listId: BREVO_LIST_ID,
      nom: data.name || null,
      total,                                              // contacts dans la liste
      blacklisted,                                        // desinscrits : comptes, mais ne recoivent rien
      destinataires: Math.max(total - blacklisted, 0)     // ce qui partira reellement
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
