import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock database for authentication codes
  const authCodes: Record<string, { code: string; expires: number }> = {};

  // API routes
  app.post("/api/auth/send-code", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "El correo electrónico es obligatorio." });
    }

    // Generate a 4-digit code (fixed to 1234 for demo/testing)
    const code = "1234";
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    authCodes[email] = { code, expires };

    // In a real app, you would send this code via email (e.g., using Nodemailer/SendGrid)
    console.log(`[AUTH] Código para ${email}: ${code}`);

    res.json({ message: "Código enviado correctamente." });
  });

  app.post("/api/auth/verify-code", (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "El correo y el código son obligatorios." });
    }

    const authData = authCodes[email];

    if (!authData) {
      return res.status(400).json({ error: "No se ha solicitado ningún código para este correo." });
    }

    if (Date.now() > authData.expires) {
      delete authCodes[email];
      return res.status(400).json({ error: "El código ha expirado. Por favor, solicita uno nuevo." });
    }

    if (authData.code !== code) {
      return res.status(400).json({ error: "El código es incorrecto." });
    }

    // Success - in a real app, generate a JWT here
    delete authCodes[email];
    res.json({ message: "Acceso concedido.", user: { email } });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

startServer();
