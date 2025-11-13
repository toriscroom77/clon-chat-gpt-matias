const { GoogleGenerativeAI } = require('@google/generative-ai');
const formidable = require('formidable');
const fs = require('fs');

// Helper to convert file to base64
const fileToGenerativePart = (path, mimeType) => {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType
        },
    };
};

// Vercel tiene un límite en el tamaño del body, necesitamos deshabilitarlo para formidable
export const config = {
    api: {
        bodyParser: false,
    },
};

module.exports = async (req, res) => {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const form = formidable({});
        const [fields, files] = await form.parse(req);
        
        const message = fields.message?.[0] || '';
        const imageFile = files.file?.[0];

        let text;

        if (imageFile) {
            // Si hay una imagen, usamos el modelo de visión
            const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
            const imagePart = fileToGenerativePart(imageFile.filepath, imageFile.mimetype);
            
            const prompt = message || '¿Qué ves en la imagen?'; // Prompt por defecto si no hay texto
            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            text = response.text();

        } else if (message) {
            // Si solo hay texto, usamos el modelo estándar
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent(message);
            const response = await result.response;
            text = response.text();
        } else {
            return res.status(400).json({ error: 'Se requiere un mensaje o un archivo.' });
        }
        
        res.status(200).json({ reply: text });

    } catch (error) {
        console.error('Error en la API de chat:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};