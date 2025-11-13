document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const attachBtn = document.getElementById('attach-btn');
    const fileInput = document.getElementById('file-input');

    let attachedFile = null;

    // --- Event Listeners ---
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', handleKeypress);
    userInput.addEventListener('input', autoGrowTextarea);
    attachBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileAttachment);

    // --- Functions ---

    /**
     * Envía el mensaje del usuario al backend.
     */
    async function sendMessage() {
        const messageText = userInput.value.trim();
        if (messageText === '' && !attachedFile) return;

        // Muestra el mensaje del usuario en el chat
        appendMessage('user', messageText);
        userInput.value = '';
        autoGrowTextarea(); // Resetea la altura del textarea

        try {
            const formData = new FormData();
            formData.append('message', messageText);
            if (attachedFile) {
                formData.append('file', attachedFile);
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                body: formData, // No se necesita 'Content-Type', el navegador lo pone solo
            });

            if (!response.ok) {
                throw new Error('Error al obtener respuesta del servidor.');
            }

            const data = await response.json();
            appendMessage('bot', data.reply);

        } catch (error) {
            console.error('Error:', error);
            appendMessage('bot', 'Lo siento, ha ocurrido un error. Inténtalo de nuevo.');
        } finally {
            // Limpia el archivo adjunto después de enviarlo (lógica futura)
            attachedFile = null;
        }
    }

    /**
     * Añade un mensaje al cuadro de chat.
     * @param {string} sender - 'user' o 'bot'.
     * @param {string} text - El contenido del mensaje.
     */
    function appendMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
        
        // Sanitiza el texto para evitar inyección de HTML
        const sanitizedText = text.replace(/</g, "<").replace(/>/g, ">");
        messageElement.innerHTML = sanitizedText; // Ya no necesitamos el "Tú:" o "Bot:"
        
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    /**
     * Maneja el evento de presionar una tecla en el input.
     * Envía el mensaje si se presiona Enter (sin Shift).
     * @param {KeyboardEvent} e - El evento del teclado.
     */
    function handleKeypress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Evita el salto de línea
            sendMessage();
        }
    }

    /**
     * Ajusta la altura del textarea automáticamente según el contenido.
     */
    function autoGrowTextarea() {
        userInput.style.height = 'auto';
        userInput.style.height = (userInput.scrollHeight) + 'px';
    }

    /**
     * Maneja la selección de un archivo.
     * @param {Event} e - El evento de cambio del input de archivo.
     */
    function handleFileAttachment(e) {
        const file = e.target.files[0];
        if (file) {
            attachedFile = file;
            // Opcional: Mostrar una vista previa o el nombre del archivo
            appendMessage('user', `Archivo adjunto: ${file.name}`);
        }
    }
});