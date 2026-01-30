const admin = require("firebase-admin");

// 1. Setup Service Account
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
  // 2. CORS Headers (ताकि Network Error न आए)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    // 3. Data Receive करें (Frontend से)
    const { title, body, image, type, link } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "Title and Body are required" });
    }

    // 4. Advanced Message Payload (Image + Data के साथ)
    const message = {
      // Notification block: Notification Tray में दिखता है
      notification: {
        title: title,
        body: body,
        // Image support (Android basic support)
        ...(image && { imageUrl: image }) 
      },
      // Data block: App के अंदर Logic handle करने के लिए (Click Action)
      data: {
        title: title,
        body: body,
        image: image || "",
        type: type || "general", // link, update, general
        link: link || ""
      },
      topic: "all"
    };

    // 5. Send to Firebase
    const response = await admin.messaging().send(message);
    console.log("Sent:", response);
    
    return res.status(200).json({ success: true, id: response });

  } catch (error) {
    console.error("Vercel Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
