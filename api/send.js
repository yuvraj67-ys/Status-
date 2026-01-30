const admin = require("firebase-admin");

// Handle Private Key newlines
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
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
  // --- CORS HEADERS (VERY IMPORTANT) ---
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow ALL
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle Preflight Request (Browser Check)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only Allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { title, body, image, link, type } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "Missing Title/Body" });
    }

    // Prepare Android Notification Payload
    const message = {
      topic: "all",
      // Data payload is preferred for background handling
      data: {
        title: title,
        body: body,
        image: image || "",
        link: link || "",
        type: type || "general"
      },
      // Notification payload for system tray when app is killed
      notification: {
        title: title,
        body: body,
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          imageUrl: image || undefined // Native image support
        }
      }
    };

    const response = await admin.messaging().send(message);
    return res.status(200).json({ success: true, id: response });

  } catch (error) {
    console.error("FCM Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
