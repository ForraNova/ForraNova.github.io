// Includes the Speech-to-Text (Microphone) logic and Markdown rendering.
        import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

        const elements = {
            status: document.getElementById('status-text'),
            progress: document.getElementById('load-progress'),
            chat: document.getElementById('chat-history'),
            input: document.getElementById('user-input'),
            send: document.getElementById('send-btn'),
            mic: document.getElementById('mic-btn'),
            notes: document.getElementById('notes-list'),
            voiceToggle: document.getElementById('voice-toggle')
        };

        let teacher;
        let lastResponse = "";

        // 1. Initialize AI
        async function init() {
            try {
                teacher = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-78M', {
                    progress_callback: (data) => {
                        if (data.status === 'progress') {
                            elements.progress.style.display = 'block';
                            elements.progress.value = data.progress;
                            elements.status.innerText = `Loading: ${Math.round(data.progress)}%`;
                        }
                    }
                });
                elements.status.innerText = "Online & Offline Ready";
                elements.progress.style.display = 'none';
                document.getElementById('status-dot').style.background = '#22c55e';
                renderNotes();
            } catch (e) { elements.status.innerText = "Load Failed. Refresh?"; }
        }

        // 2. Speech Recognition (Microphone)
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (Recognition) {
            const rec = new Recognition();
            rec.onresult = (e) => {
                elements.input.value = e.results[0][0].transcript;
                askTeacher();
            };
            elements.mic.onclick = () => {
                rec.start();
                elements.status.innerText = "Listening...";
            };
        }

        // 3. AI Teaching Logic
        async function askTeacher() {
            const question = elements.input.value.trim();
            if (!question || !teacher) return;

            appendMessage('You', question, 'user-msg');
            elements.input.value = '';

            // Advanced Prompting for better structure
            const prompt = `Instruction: You are a professional tutor. Explain "${question}" using clear sections and a summary.`;

            try {
                const result = await teacher(prompt, { max_new_tokens: 250, temperature: 0.6 });
                lastResponse = result[0].generated_text;
                
                // Use marked.js to render Markdown
                const htmlContent = marked.parse(lastResponse);
                const actionButtons = `<br><button onclick="saveNote('${question.replace(/'/g, "\\'")}')" class="save-btn">💾 Save Lesson</button>`;
                
                appendMessage('Teacher', htmlContent + actionButtons, 'bot-msg');
                if (elements.voiceToggle.checked) speak(lastResponse);
            } catch (err) {
                appendMessage('Teacher', "I encountered an error. Please try again.", 'bot-msg');
            }
        }

        function speak(text) {
            window.speechSynthesis.cancel();
            const utt = new SpeechSynthesisUtterance(text);
            utt.rate = 1.0;
            window.speechSynthesis.speak(utt);
        }

        window.saveNote = function(topic) {
            const notes = JSON.parse(localStorage.getItem('pro_teacher_notes') || '[]');
            notes.unshift({ topic, content: lastResponse });
            localStorage.setItem('pro_teacher_notes', JSON.stringify(notes));
            renderNotes();
        };

        function renderNotes() {
            const notes = JSON.parse(localStorage.getItem('pro_teacher_notes') || '[]');
            elements.notes.innerHTML = notes.map(n => `
                <div class="note-card">
                    <strong>${n.topic}</strong>
                    <div>${marked.parse(n.content)}</div>
                </div>
            `).join('');
        }

        function appendMessage(sender, text, className) {
            const div = document.createElement('div');
            div.className = `message ${className}`;
            div.innerHTML = `<strong>${sender}:</strong> <div>${text}</div>`;
            elements.chat.appendChild(div);
            elements.chat.scrollTop = elements.chat.scrollHeight;
        }

        elements.send.onclick = askTeacher;
        init();  