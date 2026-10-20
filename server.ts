
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import url from "url";
import http from "http";
import https from "https";

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 10, keepAliveMsecs: 5000 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 10, keepAliveMsecs: 5000 });

interface CachedImage {
  statusCode: number;
  headers: Record<string, string>;
  body: Buffer;
}

const mediaCache = new Map<string, CachedImage>();
const activeRequests = new Map<string, Promise<CachedImage>>();

const upload = multer({ storage: multer.memoryStorage() });

const PROMPT = `Sos el Asistente Comercial de New Balance (Grupo Dass). Tu función es ejecutar eficientemente el soporte técnico al usuario durante su proceso de compra mayorista.

REGLAS DE CONDUCTA:
1. DIRECTO Y SIN SALUDOS: Elimina todas las fórmulas de cortesía, saludos iniciales, despedidas y lenguaje empático redundante. Ve directo al grano.

2. CONTINUIDAD: Mantené el hilo de la conversación y considera el contexto anterior en cada respuesta.

3. FORMATO DE RESPUESTA: Cuando enumeres opciones, características o pasos, DEBES usar obligatoriamente saltos de línea dobles (\n\n) y viñetas de Markdown (*). No agrupes elementos en la misma línea.

4. NO existe login ni registro. NO pidas datos personales. Toda la gestión del carrito es local en el navegador del usuario.

5. CONTEXTO DE MARCA: El catálogo es exclusivamente de la marca New Balance. No solicites al usuario seleccionar marca, ya que no hay otras disponibles.

6. PROCESO DE COMPRA: Si el usuario pregunta cómo confirmar su pedido o ingresar sus datos, explícale: "No se requiere login. Una vez finalizada la carga de productos y distribución, completa los datos de identificación del cliente en la pantalla de cierre de pedido. Debes completar obligatoriamente los siguientes campos:

* CUIT / CUIL
* Razón Social
* Dirección de Entrega
* Nombre del Solicitante
* Email de Contacto
* Teléfono de Contacto

Luego, confirma el pedido. Al hacerlo, el sistema enviará automáticamente una confirmación por correo electrónico tanto a ti como a tu vendedor asignado de Grupo Dass para la formalización del mismo."

7. RESPUESTAS TÉCNICAS Y FUNCIONALIDADES DE PRODUCTO: Enfócate exclusivamente en ayudarle a completar el pedido (filtros, modos Libre/Curva, reglas de cantidad, periodos, exportación, Pared Interactiva). Además, debés conocer e informar correctamente sobre las siguientes interacciones de la tarjeta de producto:

* Favoritos (Ícono de Corazón): Ubicado en la esquina superior derecha de la imagen del calzado. Sirve para marcar y guardar el producto como favorito con un solo clic.

* Valoración y Comentarios (Ícono de Globo de Mensaje): Ubicado en la parte inferior de la tarjeta, al lado del botón de compra. Al hacerle clic, abre el diálogo "Comentarios y Valoración" donde el usuario puede calificar el producto con 1 a 5 estrellas y escribir una reseña o comentario personalizado que queda guardado localmente.

* Ícono de Cohete (🚀): Se muestra animado en la esquina superior izquierda de las tarjetas de ciertos productos. Indica que es un "Lanzamiento de Marketing" (un modelo prioritario de la colección SS27, Drop estratégico o Hot Release).

* Siglas de Estado del Producto (Badges): Los productos pueden tener etiquetas con siglas especiales que debés conocer e informar detalladamente:

  * New: Producto Nuevo.

  * C/O (Carry Over): Significa "Carry Over", un producto de continuidad que sigue en línea de la colección actual.

  * CUD (Colour Update): Significa "Colour Update", una nueva variante o actualización de color sobre un modelo ya existente.

* Exportación de Interacciones (PDF/Excel/Email): Los favoritos seleccionados, las valoraciones realizadas (estrellas) y los comentarios cargados en las tarjetas de producto se incluirán automáticamente tanto en el archivo PDF como en el Excel que se pueden descargar al confirmar el pedido. Asimismo, esta información figurará en los documentos de confirmación que se envían por mail de forma automática.

NO menciones indicadores de depuración, alertas técnicas temporales o elementos de la interfaz que no formen parte de la experiencia final del usuario.
8. ANÁLISIS DE IMÁGENES: Cuando el usuario adjunte capturas de pantalla, analízalas detalladamente para identificar errores en la interfaz, estados bloqueados, o mensajes de validación. Usa esta información para proporcionar un diagnóstico técnico preciso y soluciones visuales. Nunca digas que no puedes ver imágenes.
9. IDENTIDAD Y TONO OBLIGATORIO: Sos un asistente técnico de New Balance Argentina. Respondé ÚNICAMENTE usando el castellano rioplatense (el habla típica de Buenos Aires y Argentina). Usá obligatoriamente el voseo ("hacé", "tenés", "fijate", "vení", "mirá", "seleccioná", "cargá", "revisá"). Está TERMINANTEMENTE PROHIBIDO usar modismos, formas verbales (como el "tú" o "vosotros") o léxico de España, México o cualquier otro país. Tu forma de hablar debe sonar natural, profesional pero cercana, como la de un soporte técnico local de la empresa en Buenos Aires. Si no entendés la consulta o si no es sobre temas de soporte técnico de la plataforma New Balance SS27, indicá amablemente que no pudiste procesar la pregunta y sugerí tópicos de ayuda relacionados con la navegación, carga de pedidos o confirmación.`;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function callGeminiWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      console.warn(`Gemini call attempt ${i + 1} failed. Error: ${err.message || err}`);
      const isTransient = 
        err.status === 503 || 
        err.statusCode === 503 ||
        err.status === 429 ||
        err.statusCode === 429 ||
        (err.message && (
          err.message.includes('503') || 
          err.message.includes('Service Unavailable') || 
          err.message.includes('429') || 
          err.message.includes('Resource has been exhausted') ||
          err.message.includes('socket hang up') ||
          err.message.includes('ECONNRESET') ||
          err.message.includes('ETIMEDOUT')
        ));
      
      if (isTransient && i < retries - 1) {
        const backoff = delay * Math.pow(2, i);
        console.log(`Retrying in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Failed to call Gemini after retries");
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  const PORT = 3000;

  // API route for chat
  app.use("/api", (req, res, next) => {
    console.log("API request:", req.method, req.path);
    next();
  });

  app.post("/api/chat", (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(500).setHeader('Content-Type', 'application/json').json({
          error: "Upload Error",
          message: err.message
        });
      }
      next();
    });
  }, async (req, res) => {
    console.log("Received chat request");
    
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing!");
      return res.status(500).setHeader('Content-Type', 'application/json').json({
        error: "Server Configuration Error",
        message: "Gemini API key is not configured"
      });
    }

    const { message, context } = req.body;
    console.log("Message:", message);
    const file = req.file;
    try {
      console.log("Creating chat with model: gemini-3.8-flash");
      const chat = ai.chats.create({
        model: "gemini-3.8-flash",
        config: {
          systemInstruction: `${PROMPT}\n\nNota: ${context}`,
        },
      });

      let content: any = message;
      if (file) {
        content = [
          message,
          {
            inlineData: {
              data: file.buffer.toString("base64"),
              mimeType: file.mimetype,
            },
          },
        ];
      }

      console.log("Sending chat message to AI...");
      const response = await callGeminiWithRetry(() => chat.sendMessage({ message: content }), 3, 1500);
      console.log("AI message sent successfully");
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI chat error:", error);
      res.status(500).setHeader('Content-Type', 'application/json').json({ 
        error: "Failed to send message", 
        message: error.message || "Unknown error"
      });
    }
  });

  // AI Storefront Window Generation (Nano Banana / Gemini Image with graceful quota fallback)
  app.post("/api/generate-window", async (req, res) => {
    try {
      const { topName, topColor, bottomName, bottomColor, shoeName, gender, themeTitle } = req.body;
      const desc = `${topColor || ''} ${bottomColor || ''} ${themeTitle || ''} ${topName || ''}`.toLowerCase();

      // Resolve matching high-resolution visual merchandising display for this palette
      let curatedImageUrl = '/src/assets/images/nb_dual_blue_mannequins_1792114132638.jpg';
      if (/borgoña|burgundy|vino|maroon|bordo/i.test(desc)) {
        curatedImageUrl = '/src/assets/images/nb_mannequins_burgundy_trackside_1792162395308.jpg';
      } else if (/rugby|rosa|pink|cxp/i.test(desc)) {
        curatedImageUrl = '/src/assets/images/nb_mannequins_rugby_bone_pink_1792162412623.jpg';
      } else if (/verde|ivy|forest|div|bosque/i.test(desc)) {
        curatedImageUrl = '/src/assets/images/nb_mannequins_ivy_green_window_1792162693069.jpg';
      } else if (/gris|grey|melange|bh0/i.test(desc)) {
        curatedImageUrl = '/src/assets/images/nb_mannequins_grey_melange_window_1792162705509.jpg';
      } else if (/azul|cobalt|blue|cb6|navy/i.test(desc)) {
        curatedImageUrl = '/src/assets/images/nb_mannequins_burgundy_cobalt_real.jpg';
      } else if (/hueso|bone|oyster|bg0|crema|lin/i.test(desc)) {
        curatedImageUrl = '/src/assets/images/nb_mannequins_bone_duo_window_1792157324099.jpg';
      } else if (/run|running|speed|maraton|fuelcell/i.test(desc)) {
        curatedImageUrl = '/src/assets/images/nb_dual_mannequins_running_1792110450203.jpg';
      } else if (/1906|heritage|retro|varsity/i.test(desc)) {
        curatedImageUrl = '/src/assets/images/nb_dual_mannequins_heritage_1792110451505.jpg';
      } else {
        curatedImageUrl = '/src/assets/images/nb_dual_mannequins_lifestyle_1792110449370.jpg';
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.json({ success: true, imageUrl: curatedImageUrl, source: 'curated' });
      }

      // Try generating with Gemini image model, gracefully catching quota (429) or plan limits
      try {
        const prompt = `Photorealistic commercial visual merchandising display in a flagship New Balance store window. Two athletic mannequins standing side-by-side on a modern illuminated platform. Male and female mannequins wearing New Balance ${topName || 'hoodie or jacket'} in ${topColor || 'official brand color'}, matching ${bottomName || 'athletic pants/shorts'} in ${bottomColor || 'color'}, and ${shoeName || 'New Balance sneakers'}. High-end boutique visual merchandising, clean store lighting, street reflections on window glass, ultra-sharp realistic textures, 8k quality.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: prompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: "4:3",
            }
          } as any
        });

        let imageUrl: string | null = null;
        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData) {
              imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
              break;
            }
          }
        }

        if (imageUrl) {
          return res.json({ success: true, imageUrl, source: 'gemini' });
        }
      } catch (genError: any) {
        // Quota 429 or rate limit -> serve curated high-res studio render cleanly without noisy errors
        const isQuota = genError?.status === 429 || 
          (genError?.message && genError.message.includes('429')) || 
          (genError?.message && genError.message.includes('quota'));
        if (isQuota) {
          console.info("[AI Window] Gemini image generation quota limit reached on free tier. Serving calibrated high-definition store render.");
        } else {
          console.info("[AI Window] Using calibrated high-definition store render:", genError?.message || "fallback");
        }
      }

      // Seamless fallback to the matching high-res window render
      return res.json({ 
        success: true, 
        imageUrl: curatedImageUrl, 
        source: 'curated',
        notice: 'Vidriera New Balance oficial de alta fidelidad adaptada a las prendas' 
      });
    } catch (error: any) {
      return res.json({ 
        success: true, 
        imageUrl: '/src/assets/images/nb_dual_blue_mannequins_1792114132638.jpg', 
        source: 'fallback' 
      });
    }
  });

  // Helper to fetch, cache and coalesce media requests
  function fetchUrl(targetUrl: string, attempt: number = 0): Promise<CachedImage> {
    const cached = mediaCache.get(targetUrl);
    if (cached) {
      return Promise.resolve(cached);
    }

    let activePromise = activeRequests.get(targetUrl);
    if (!activePromise) {
      activePromise = new Promise<CachedImage>((resolve, reject) => {
        let rejected = false;
        const safeReject = (err: any) => {
          if (!rejected) {
            rejected = true;
            reject(err);
          }
        };
        const safeResolve = (val: any) => {
          if (!rejected) {
            rejected = true;
            resolve(val);
          }
        };

        try {
          const parsedUrl = new URL(targetUrl);
          const isHttps = parsedUrl.protocol === 'https:';
          const client = isHttps ? https : http;

          const options = {
            method: 'GET',
            rejectUnauthorized: false,
            timeout: 15000,
            agent: attempt > 0 ? false : (isHttps ? httpsAgent : httpAgent),
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
              'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          };

          const req = client.request(parsedUrl.toString(), options, (proxyRes: any) => {
            if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
              req.destroy();
              safeReject(new Error(`Code_${proxyRes.statusCode}`));
              return;
            }

            const chunks: Buffer[] = [];
            proxyRes.on('data', (chunk: Buffer) => chunks.push(chunk));
            proxyRes.on('end', () => {
              const body = Buffer.concat(chunks);
              const headers: Record<string, string> = {
                'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*'
              };
              if (proxyRes.headers['content-type']) {
                headers['Content-Type'] = proxyRes.headers['content-type'] as string;
              }
              if (proxyRes.headers['content-length']) {
                headers['Content-Length'] = body.length.toString();
              }

              const result: CachedImage = {
                statusCode: proxyRes.statusCode || 200,
                headers,
                body
              };

              // Bounded cache size (FIFO evict)
              if (mediaCache.size > 500) {
                const firstKey = mediaCache.keys().next().value;
                if (firstKey) mediaCache.delete(firstKey);
              }
              mediaCache.set(targetUrl, result);
              safeResolve(result);
            });
            proxyRes.on('error', (err: any) => {
              safeReject(err);
            });
          });

          req.on('timeout', () => {
            req.destroy();
            safeReject(new Error('time_limit'));
          });

          req.on('error', (err: any) => {
            safeReject(err);
          });

          req.end();
        } catch (e) {
          safeReject(e);
        }
      });

      activeRequests.set(targetUrl, activePromise);
      // Clean up map when promise settles without causing unhandled rejections
      activePromise
        .then(() => {
          if (activeRequests.get(targetUrl) === activePromise) {
            activeRequests.delete(targetUrl);
          }
        })
        .catch(() => {
          if (activeRequests.get(targetUrl) === activePromise) {
            activeRequests.delete(targetUrl);
          }
        });
    }

    return activePromise;
  }

  // Media proxy route to avoid mixed content block
  app.get("/api/media-proxy", (req, res) => {
    const targetUrl = req.query.url;
    if (typeof targetUrl !== 'string' || !targetUrl) {
      return res.status(400).send("Missing url parameter");
    }

    try {
      let decodedUrl = decodeURIComponent(targetUrl);
      if (decodedUrl.includes('drive.google.com/uc?') || decodedUrl.includes('drive.google.com/file/d/')) {
        const match = decodedUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) || decodedUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          decodedUrl = `https://lh3.googleusercontent.com/d/${match[1]}=s500`;
        }
      }
      let responseSent = false;
      
      // Build candidate URLs to try in order
      const urlsToTry: string[] = [decodedUrl];
      const cleanUrlPath = decodedUrl.split('?')[0].toLowerCase();
      if (cleanUrlPath.endsWith('.webp')) {
        const queryIndex = decodedUrl.indexOf('?');
        const urlWithoutQuery = queryIndex !== -1 ? decodedUrl.substring(0, queryIndex) : decodedUrl;
        const query = queryIndex !== -1 ? decodedUrl.substring(queryIndex) : '';
        urlsToTry.push(urlWithoutQuery.substring(0, urlWithoutQuery.length - 5) + '.png' + query);
        urlsToTry.push(urlWithoutQuery.substring(0, urlWithoutQuery.length - 5) + '.jpg' + query);
      } else if (cleanUrlPath.endsWith('.png')) {
        const queryIndex = decodedUrl.indexOf('?');
        const urlWithoutQuery = queryIndex !== -1 ? decodedUrl.substring(0, queryIndex) : decodedUrl;
        const query = queryIndex !== -1 ? decodedUrl.substring(queryIndex) : '';
        urlsToTry.push(urlWithoutQuery.substring(0, urlWithoutQuery.length - 4) + '.webp' + query);
        urlsToTry.push(urlWithoutQuery.substring(0, urlWithoutQuery.length - 4) + '.jpg' + query);
      }

      function tryFetch(urlIndex: number, attempt: number = 0) {
        if (responseSent) return;

        if (urlIndex >= urlsToTry.length) {
          console.log(`[Media Proxy] Finished trying formats for ${decodedUrl} - fallback returned`);
          if (!responseSent) {
            responseSent = true;
            sendFallbackPixel();
          }
          return;
        }

        const activeUrl = urlsToTry[urlIndex];
        const maxRetries = 2;

        fetchUrl(activeUrl, attempt)
          .then((cachedImage) => {
            if (responseSent) return;
            responseSent = true;
            res.writeHead(cachedImage.statusCode, cachedImage.headers);
            res.end(cachedImage.body);
          })
          .catch((error: any) => {
            if (responseSent) return;
            const details = error?.message || 'status_unavailable';

            if (attempt < maxRetries) {
              console.log(`[Media Proxy] Retry ${attempt + 1}/${maxRetries} for ${activeUrl} (${details})`);
              setTimeout(() => tryFetch(urlIndex, attempt + 1), 500);
            } else {
              console.log(`[Media Proxy] Trying next format after ${activeUrl} (${details})`);
              tryFetch(urlIndex + 1, 0);
            }
          });
      }

      function sendFallbackPixel() {
        // 1x1 transparent PNG fallback so the app does not show broken image links
        const transparentPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': transparentPng.length,
          'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*'
        });
        res.end(transparentPng);
      }

      tryFetch(0, 0);
    } catch (error) {
      console.error("Error in media proxy route:", error);
      res.status(500).send("Error proxying media");
    }
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global Express Error:", err);
    res.status(500).setHeader('Content-Type', 'application/json').json({
      error: "Internal Server Error",
      message: err.message || "Unknown error",
    });
  });

  // Cache options for assets to handle high concurrent traffic
  const staticCacheOptions = {
    maxAge: '7d',
    immutable: true
  };

  // Serve static assets from src/assets, public, and images directly across all environments
  app.use('/src/assets', express.static(path.join(process.cwd(), 'src', 'assets'), staticCacheOptions));
  app.use('/assets', express.static(path.join(process.cwd(), 'src', 'assets'), staticCacheOptions));
  app.use('/public', express.static(path.join(process.cwd(), 'public'), staticCacheOptions));
  app.use('/images', express.static(path.join(process.cwd(), 'public', 'images'), staticCacheOptions));

  // Smart fallback for image files (.jpg, .jpeg, .png, .webp, .svg)
  app.get(/\.(jpg|jpeg|png|webp|svg|gif)$/i, (req, res, next) => {
    const filename = path.basename(req.path);
    const candidatePaths = [
      path.join(process.cwd(), 'src', 'assets', 'images', filename),
      path.join(process.cwd(), 'public', 'images', 'mannequins', filename),
      path.join(process.cwd(), 'public', 'images', filename),
      path.join(process.cwd(), 'src', 'assets', req.path.replace(/^\/(src\/)?assets\//, '')),
      path.join(process.cwd(), 'public', req.path.replace(/^\/public\//, ''))
    ];

    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        return res.sendFile(candidate);
      }
    }
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1d',
      setHeaders: (res, pathUrl) => {
        if (pathUrl.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        }
      }
    }));
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.match(/\.(jpg|jpeg|png|webp|svg|gif|ico|json|css|js|map)$/i)) {
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        next();
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
