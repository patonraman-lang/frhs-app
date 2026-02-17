// /api/submit-frhs.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      profile,
      booking,
      scores,
      topGaps,
      answers
    } = req.body || {};

    if (!profile?.name || !profile?.organisation || !profile?.role) {
      return res.status(400).json({ error: "Missing profile fields" });
    }
    if (!booking?.email || !booking?.selectedSlot) {
      return res.status(400).json({ error: "Missing booking fields" });
    }

    const submissionId = `FRHS-${Date.now()}`;
    const submittedAt = new Date().toISOString();

    const notes = [
      `Submission ID: ${submissionId}`,
      `Submitted At: ${submittedAt}`,
      `Name: ${profile.name}`,
      `Organisation: ${profile.organisation}`,
      `Role/Title: ${profile.role}`,
      `Email: ${booking.email}`,
      `Selected Slot: ${booking.selectedSlot}`,
      `Overall Score: ${scores?.overall ?? 0}%`,
      `Overall Band: ${scores?.band ?? "Emerging"}`,
      `Pillar 1 %: ${scores?.pillars?.[0] ?? 0}`,
      `Pillar 2 %: ${scores?.pillars?.[1] ?? 0}`,
      `Pillar 3 %: ${scores?.pillars?.[2] ?? 0}`,
      `Pillar 4 %: ${scores?.pillars?.[3] ?? 0}`,
      `Pillar 5 %: ${scores?.pillars?.[4] ?? 0}`,
      "",
      "Top Gaps:",
      ...(topGaps || []),
      "",
      "Answers JSON:",
      JSON.stringify(answers || {})
    ].join("\n");

    // Link results fields from your screenshot:
    // Name (text), Notes (long text), Status (single select: Todo/In progress/Done)
    const fields = {
      Name: `${profile.name} - FRHS`,
      Notes: notes,
      Status: "Todo"
    };

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          records: [{ fields }],
          typecast: true
        })
      }
    );

    const data = await airtableRes.json();

    if (!airtableRes.ok) {
      return res.status(airtableRes.status).json({
        error: "Airtable write failed",
        details: data
      });
    }

    return res.status(200).json({
      ok: true,
      submissionId,
      recordId: data?.records?.[0]?.id || null
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: String(err)
    });
  }
}
