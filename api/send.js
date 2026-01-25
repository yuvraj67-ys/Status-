const admin = require("firebase-admin");

export default async function handler(req, res) {
  // 1. CORS Allow Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 2. Check if Env Variables exist
    if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error("Missing Environment Variables in Vercel");
    }

    // 3. Fix Private Key Format (The most common error)
    // Vercel turns \n into literal characters, we need to fix that back to newlines
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    // 4. Initialize Firebase (Only if not already active)
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: "Title and Body are required" });
    }

    // 5. Send Notification
    const message = {
      notification: { title, body },
      topic: "all"
    };

    const response = await admin.messaging().send(message);
    return res.status(200).json({ success: true, id: response });

  } catch (error) {
    console.error("Vercel Error Logs:", error);
    // यह Line एरर को JSON में बदलकर भेजेगी, ताकि Browser में "Unexpected token" न आए
    return res.status(500).json({ 
      success: false, 
      error: error.message, 
      details: "Check Vercel Function Logs for more info" 
    });
  }
}
