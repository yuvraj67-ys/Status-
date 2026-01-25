const admin = require("firebase-admin");

// Environment Variables से Key को सही format में load करना
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Vercel में New Line (\n) का issue fix करने के लिए replace logic
  privateKey: process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default async function handler(req, res) {
  // 1. CORS Allow करना (ताकि Admin Panel इसे access कर सके)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "Title and Body are required" });
    }

    // 2. Notification Message तैयार करना
    const message = {
      notification: {
        title: title,
        body: body,
      },
      topic: "all" // Android App में users "all" topic पर subscribe होने चाहिए
    };

    // 3. Notification भेजना
    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
    
    return res.status(200).json({ success: true, messageId: response });

  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
