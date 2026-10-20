// server.ts
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import http from "http";
import https from "https";
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
var httpAgent = new http.Agent({ keepAlive: true, maxSockets: 10, keepAliveMsecs: 5e3 });
var httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 10, keepAliveMsecs: 5e3 });
var mediaCache = /* @__PURE__ */ new Map();
var activeRequests = /* @__PURE__ */ new Map();
var upload = multer({ storage: multer.memoryStorage() });
var PROMPT = `Sos el Asistente Comercial de New Balance (Grupo Dass). Tu funci\xF3n es ejecutar eficientemente el soporte t\xE9cnico al usuario durante su proceso de compra mayorista.

REGLAS DE CONDUCTA:
1. DIRECTO Y SIN SALUDOS: Elimina todas las f\xF3rmulas de cortes\xEDa, saludos iniciales, despedidas y lenguaje emp\xE1tico redundante. Ve directo al grano.

2. CONTINUIDAD: Manten\xE9 el hilo de la conversaci\xF3n y considera el contexto anterior en cada respuesta.

3. FORMATO DE RESPUESTA: Cuando enumeres opciones, caracter\xEDsticas o pasos, DEBES usar obligatoriamente saltos de l\xEDnea dobles (

) y vi\xF1etas de Markdown (*). No agrupes elementos en la misma l\xEDnea.

4. NO existe login ni registro. NO pidas datos personales. Toda la gesti\xF3n del carrito es local en el navegador del usuario.

5. CONTEXTO DE MARCA: El cat\xE1logo es exclusivamente de la marca New Balance. No solicites al usuario seleccionar marca, ya que no hay otras disponibles.

6. PROCESO DE COMPRA: Si el usuario pregunta c\xF3mo confirmar su pedido o ingresar sus datos, expl\xEDcale: "No se requiere login. Una vez finalizada la carga de productos y distribuci\xF3n, completa los datos de identificaci\xF3n del cliente en la pantalla de cierre de pedido. Debes completar obligatoriamente los siguientes campos:

* CUIT / CUIL
* Raz\xF3n Social
* Direcci\xF3n de Entrega
* Nombre del Solicitante
* Email de Contacto
* Tel\xE9fono de Contacto

Luego, confirma el pedido. Al hacerlo, el sistema enviar\xE1 autom\xE1ticamente una confirmaci\xF3n por correo electr\xF3nico tanto a ti como a tu vendedor asignado de Grupo Dass para la formalizaci\xF3n del mismo."

7. RESPUESTAS T\xC9CNICAS Y FUNCIONALIDADES DE PRODUCTO: Enf\xF3cate exclusivamente en ayudarle a completar el pedido (filtros, modos Libre/Curva, reglas de cantidad, periodos, exportaci\xF3n, Pared Interactiva). Adem\xE1s, deb\xE9s conocer e informar correctamente sobre las siguientes interacciones de la tarjeta de producto:

* Favoritos (\xCDcono de Coraz\xF3n): Ubicado en la esquina superior derecha de la imagen del calzado. Sirve para marcar y guardar el producto como favorito con un solo clic.

* Valoraci\xF3n y Comentarios (\xCDcono de Globo de Mensaje): Ubicado en la parte inferior de la tarjeta, al lado del bot\xF3n de compra. Al hacerle clic, abre el di\xE1logo "Comentarios y Valoraci\xF3n" donde el usuario puede calificar el producto con 1 a 5 estrellas y escribir una rese\xF1a o comentario personalizado que queda guardado localmente.

* \xCDcono de Cohete (\u{1F680}): Se muestra animado en la esquina superior izquierda de las tarjetas de ciertos productos. Indica que es un "Lanzamiento de Marketing" (un modelo prioritario de la colecci\xF3n SS27, Drop estrat\xE9gico o Hot Release).

* Siglas de Estado del Producto (Badges): Los productos pueden tener etiquetas con siglas especiales que deb\xE9s conocer e informar detalladamente:

  * New: Producto Nuevo.

  * C/O (Carry Over): Significa "Carry Over", un producto de continuidad que sigue en l\xEDnea de la colecci\xF3n actual.

  * CUD (Colour Update): Significa "Colour Update", una nueva variante o actualizaci\xF3n de color sobre un modelo ya existente.

* Exportaci\xF3n de Interacciones (PDF/Excel/Email): Los favoritos seleccionados, las valoraciones realizadas (estrellas) y los comentarios cargados en las tarjetas de producto se incluir\xE1n autom\xE1ticamente tanto en el archivo PDF como en el Excel que se pueden descargar al confirmar el pedido. Asimismo, esta informaci\xF3n figurar\xE1 en los documentos de confirmaci\xF3n que se env\xEDan por mail de forma autom\xE1tica.

NO menciones indicadores de depuraci\xF3n, alertas t\xE9cnicas temporales o elementos de la interfaz que no formen parte de la experiencia final del usuario.
8. AN\xC1LISIS DE IM\xC1GENES: Cuando el usuario adjunte capturas de pantalla, anal\xEDzalas detalladamente para identificar errores en la interfaz, estados bloqueados, o mensajes de validaci\xF3n. Usa esta informaci\xF3n para proporcionar un diagn\xF3stico t\xE9cnico preciso y soluciones visuales. Nunca digas que no puedes ver im\xE1genes.
9. IDENTIDAD Y TONO OBLIGATORIO: Sos un asistente t\xE9cnico de New Balance Argentina. Respond\xE9 \xDANICAMENTE usando el castellano rioplatense (el habla t\xEDpica de Buenos Aires y Argentina). Us\xE1 obligatoriamente el voseo ("hac\xE9", "ten\xE9s", "fijate", "ven\xED", "mir\xE1", "seleccion\xE1", "carg\xE1", "revis\xE1"). Est\xE1 TERMINANTEMENTE PROHIBIDO usar modismos, formas verbales (como el "t\xFA" o "vosotros") o l\xE9xico de Espa\xF1a, M\xE9xico o cualquier otro pa\xEDs. Tu forma de hablar debe sonar natural, profesional pero cercana, como la de un soporte t\xE9cnico local de la empresa en Buenos Aires. Si no entend\xE9s la consulta o si no es sobre temas de soporte t\xE9cnico de la plataforma New Balance SS27, indic\xE1 amablemente que no pudiste procesar la pregunta y suger\xED t\xF3picos de ayuda relacionados con la navegaci\xF3n, carga de pedidos o confirmaci\xF3n.`;
var ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
async function callGeminiWithRetry(fn, retries = 3, delay = 1e3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`Gemini call attempt ${i + 1} failed. Error: ${err.message || err}`);
      const isTransient = err.status === 503 || err.statusCode === 503 || err.status === 429 || err.statusCode === 429 || err.message && (err.message.includes("503") || err.message.includes("Service Unavailable") || err.message.includes("429") || err.message.includes("Resource has been exhausted") || err.message.includes("socket hang up") || err.message.includes("ECONNRESET") || err.message.includes("ETIMEDOUT"));
      if (isTransient && i < retries - 1) {
        const backoff = delay * Math.pow(2, i);
        console.log(`Retrying in ${backoff}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
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
  const PORT = 3e3;
  app.use("/api", (req, res, next) => {
    console.log("API request:", req.method, req.path);
    next();
  });
  app.post("/api/chat", (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(500).setHeader("Content-Type", "application/json").json({
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
      return res.status(500).setHeader("Content-Type", "application/json").json({
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
          systemInstruction: `${PROMPT}

Nota: ${context}`
        }
      });
      let content = message;
      if (file) {
        content = [
          message,
          {
            inlineData: {
              data: file.buffer.toString("base64"),
              mimeType: file.mimetype
            }
          }
        ];
      }
      console.log("Sending chat message to AI...");
      const response = await callGeminiWithRetry(() => chat.sendMessage({ message: content }), 3, 1500);
      console.log("AI message sent successfully");
      res.json({ text: response.text });
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).setHeader("Content-Type", "application/json").json({
        error: "Failed to send message",
        message: error.message || "Unknown error"
      });
    }
  });
  app.post("/api/generate-window", async (req, res) => {
    try {
      const { topName, topColor, bottomName, bottomColor, shoeName, gender, themeTitle } = req.body;
      const desc = `${topColor || ""} ${bottomColor || ""} ${themeTitle || ""} ${topName || ""}`.toLowerCase();
      let curatedImageUrl = "/src/assets/images/nb_dual_blue_mannequins_1792114132638.jpg";
      if (/borgoña|burgundy|vino|maroon|bordo/i.test(desc)) {
        curatedImageUrl = "/src/assets/images/nb_mannequins_burgundy_trackside_1792162395308.jpg";
      } else if (/rugby|rosa|pink|cxp/i.test(desc)) {
        curatedImageUrl = "/src/assets/images/nb_mannequins_rugby_bone_pink_1792162412623.jpg";
      } else if (/verde|ivy|forest|div|bosque/i.test(desc)) {
        curatedImageUrl = "/src/assets/images/nb_mannequins_ivy_green_window_1792162693069.jpg";
      } else if (/gris|grey|melange|bh0/i.test(desc)) {
        curatedImageUrl = "/src/assets/images/nb_mannequins_grey_melange_window_1792162705509.jpg";
      } else if (/azul|cobalt|blue|cb6|navy/i.test(desc)) {
        curatedImageUrl = "/src/assets/images/nb_mannequins_burgundy_cobalt_real.jpg";
      } else if (/hueso|bone|oyster|bg0|crema|lin/i.test(desc)) {
        curatedImageUrl = "/src/assets/images/nb_mannequins_bone_duo_window_1792157324099.jpg";
      } else if (/run|running|speed|maraton|fuelcell/i.test(desc)) {
        curatedImageUrl = "/src/assets/images/nb_dual_mannequins_running_1792110450203.jpg";
      } else if (/1906|heritage|retro|varsity/i.test(desc)) {
        curatedImageUrl = "/src/assets/images/nb_dual_mannequins_heritage_1792110451505.jpg";
      } else {
        curatedImageUrl = "/src/assets/images/nb_dual_mannequins_lifestyle_1792110449370.jpg";
      }
      if (!process.env.GEMINI_API_KEY) {
        return res.json({ success: true, imageUrl: curatedImageUrl, source: "curated" });
      }
      try {
        const prompt = `Photorealistic commercial visual merchandising display in a flagship New Balance store window. Two athletic mannequins standing side-by-side on a modern illuminated platform. Male and female mannequins wearing New Balance ${topName || "hoodie or jacket"} in ${topColor || "official brand color"}, matching ${bottomName || "athletic pants/shorts"} in ${bottomColor || "color"}, and ${shoeName || "New Balance sneakers"}. High-end boutique visual merchandising, clean store lighting, street reflections on window glass, ultra-sharp realistic textures, 8k quality.`;
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite-image",
          contents: {
            parts: [{ text: prompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: "4:3"
            }
          }
        });
        let imageUrl = null;
        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData) {
              imageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
              break;
            }
          }
        }
        if (imageUrl) {
          return res.json({ success: true, imageUrl, source: "gemini" });
        }
      } catch (genError) {
        const isQuota = genError?.status === 429 || genError?.message && genError.message.includes("429") || genError?.message && genError.message.includes("quota");
        if (isQuota) {
          console.info("[AI Window] Gemini image generation quota limit reached on free tier. Serving calibrated high-definition store render.");
        } else {
          console.info("[AI Window] Using calibrated high-definition store render:", genError?.message || "fallback");
        }
      }
      return res.json({
        success: true,
        imageUrl: curatedImageUrl,
        source: "curated",
        notice: "Vidriera New Balance oficial de alta fidelidad adaptada a las prendas"
      });
    } catch (error) {
      return res.json({
        success: true,
        imageUrl: "/src/assets/images/nb_dual_blue_mannequins_1792114132638.jpg",
        source: "fallback"
      });
    }
  });
  function fetchUrl(targetUrl, attempt = 0) {
    const cached = mediaCache.get(targetUrl);
    if (cached) {
      return Promise.resolve(cached);
    }
    let activePromise = activeRequests.get(targetUrl);
    if (!activePromise) {
      activePromise = new Promise((resolve, reject) => {
        let rejected = false;
        const safeReject = (err) => {
          if (!rejected) {
            rejected = true;
            reject(err);
          }
        };
        const safeResolve = (val) => {
          if (!rejected) {
            rejected = true;
            resolve(val);
          }
        };
        try {
          const parsedUrl = new URL(targetUrl);
          const isHttps = parsedUrl.protocol === "https:";
          const client = isHttps ? https : http;
          const options = {
            method: "GET",
            rejectUnauthorized: false,
            timeout: 15e3,
            agent: attempt > 0 ? false : isHttps ? httpsAgent : httpAgent,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
              "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
              "Cache-Control": "no-cache",
              "Pragma": "no-cache"
            }
          };
          const req = client.request(parsedUrl.toString(), options, (proxyRes) => {
            if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
              req.destroy();
              safeReject(new Error(`Code_${proxyRes.statusCode}`));
              return;
            }
            const chunks = [];
            proxyRes.on("data", (chunk) => chunks.push(chunk));
            proxyRes.on("end", () => {
              const body = Buffer.concat(chunks);
              const headers = {
                "Cache-Control": "public, max-age=86400",
                "Access-Control-Allow-Origin": "*"
              };
              if (proxyRes.headers["content-type"]) {
                headers["Content-Type"] = proxyRes.headers["content-type"];
              }
              if (proxyRes.headers["content-length"]) {
                headers["Content-Length"] = body.length.toString();
              }
              const result = {
                statusCode: proxyRes.statusCode || 200,
                headers,
                body
              };
              if (mediaCache.size > 500) {
                const firstKey = mediaCache.keys().next().value;
                if (firstKey) mediaCache.delete(firstKey);
              }
              mediaCache.set(targetUrl, result);
              safeResolve(result);
            });
            proxyRes.on("error", (err) => {
              safeReject(err);
            });
          });
          req.on("timeout", () => {
            req.destroy();
            safeReject(new Error("time_limit"));
          });
          req.on("error", (err) => {
            safeReject(err);
          });
          req.end();
        } catch (e) {
          safeReject(e);
        }
      });
      activeRequests.set(targetUrl, activePromise);
      activePromise.then(() => {
        if (activeRequests.get(targetUrl) === activePromise) {
          activeRequests.delete(targetUrl);
        }
      }).catch(() => {
        if (activeRequests.get(targetUrl) === activePromise) {
          activeRequests.delete(targetUrl);
        }
      });
    }
    return activePromise;
  }
  app.get("/api/media-proxy", (req, res) => {
    const targetUrl = req.query.url;
    if (typeof targetUrl !== "string" || !targetUrl) {
      return res.status(400).send("Missing url parameter");
    }
    try {
      let tryFetch = function(urlIndex, attempt = 0) {
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
        fetchUrl(activeUrl, attempt).then((cachedImage) => {
          if (responseSent) return;
          responseSent = true;
          res.writeHead(cachedImage.statusCode, cachedImage.headers);
          res.end(cachedImage.body);
        }).catch((error) => {
          if (responseSent) return;
          const details = error?.message || "status_unavailable";
          if (attempt < maxRetries) {
            console.log(`[Media Proxy] Retry ${attempt + 1}/${maxRetries} for ${activeUrl} (${details})`);
            setTimeout(() => tryFetch(urlIndex, attempt + 1), 500);
          } else {
            console.log(`[Media Proxy] Trying next format after ${activeUrl} (${details})`);
            tryFetch(urlIndex + 1, 0);
          }
        });
      }, sendFallbackPixel = function() {
        const transparentPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": transparentPng.length,
          "Cache-Control": "public, max-age=86400",
          "Access-Control-Allow-Origin": "*"
        });
        res.end(transparentPng);
      };
      let decodedUrl = decodeURIComponent(targetUrl);
      if (decodedUrl.includes("drive.google.com/uc?") || decodedUrl.includes("drive.google.com/file/d/")) {
        const match = decodedUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) || decodedUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          decodedUrl = `https://lh3.googleusercontent.com/d/${match[1]}=s500`;
        }
      }
      let responseSent = false;
      const urlsToTry = [decodedUrl];
      const cleanUrlPath = decodedUrl.split("?")[0].toLowerCase();
      if (cleanUrlPath.endsWith(".webp")) {
        const queryIndex = decodedUrl.indexOf("?");
        const urlWithoutQuery = queryIndex !== -1 ? decodedUrl.substring(0, queryIndex) : decodedUrl;
        const query = queryIndex !== -1 ? decodedUrl.substring(queryIndex) : "";
        urlsToTry.push(urlWithoutQuery.substring(0, urlWithoutQuery.length - 5) + ".png" + query);
        urlsToTry.push(urlWithoutQuery.substring(0, urlWithoutQuery.length - 5) + ".jpg" + query);
      } else if (cleanUrlPath.endsWith(".png")) {
        const queryIndex = decodedUrl.indexOf("?");
        const urlWithoutQuery = queryIndex !== -1 ? decodedUrl.substring(0, queryIndex) : decodedUrl;
        const query = queryIndex !== -1 ? decodedUrl.substring(queryIndex) : "";
        urlsToTry.push(urlWithoutQuery.substring(0, urlWithoutQuery.length - 4) + ".webp" + query);
        urlsToTry.push(urlWithoutQuery.substring(0, urlWithoutQuery.length - 4) + ".jpg" + query);
      }
      tryFetch(0, 0);
    } catch (error) {
      console.error("Error in media proxy route:", error);
      res.status(500).send("Error proxying media");
    }
  });
  app.use((err, req, res, next) => {
    console.error("Global Express Error:", err);
    res.status(500).setHeader("Content-Type", "application/json").json({
      error: "Internal Server Error",
      message: err.message || "Unknown error"
    });
  });
  const staticCacheOptions = {
    maxAge: "7d",
    immutable: true
  };
  app.use("/src/assets", express.static(path.join(process.cwd(), "src", "assets"), staticCacheOptions));
  app.use("/assets", express.static(path.join(process.cwd(), "src", "assets"), staticCacheOptions));
  app.use("/public", express.static(path.join(process.cwd(), "public"), staticCacheOptions));
  app.use("/images", express.static(path.join(process.cwd(), "public", "images"), staticCacheOptions));
  app.get(/\.(jpg|jpeg|png|webp|svg|gif)$/i, (req, res, next) => {
    const filename = path.basename(req.path);
    const candidatePaths = [
      path.join(process.cwd(), "src", "assets", "images", filename),
      path.join(process.cwd(), "public", "images", "mannequins", filename),
      path.join(process.cwd(), "public", "images", filename),
      path.join(process.cwd(), "src", "assets", req.path.replace(/^\/(src\/)?assets\//, "")),
      path.join(process.cwd(), "public", req.path.replace(/^\/public\//, ""))
    ];
    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        res.setHeader("Cache-Control", "public, max-age=604800, immutable");
        return res.sendFile(candidate);
      }
    }
    next();
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      maxAge: "1d",
      setHeaders: (res, pathUrl) => {
        if (pathUrl.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        } else {
          res.setHeader("Cache-Control", "public, max-age=604800, immutable");
        }
      }
    }));
    app.use((req, res, next) => {
      if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.match(/\.(jpg|jpeg|png|webp|svg|gif|ico|json|css|js|map)$/i)) {
        res.sendFile(path.join(distPath, "index.html"));
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
