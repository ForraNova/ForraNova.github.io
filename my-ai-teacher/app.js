import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

// Fix for GitHub Pages: Disable local models, force cloud fetch then local cache
env.allowLocalModels = false;
env.useBrowserCache = true;

const elements = {
    status: document.getElementById('status-text'),
    progress: document.getElementById('load-progress'),
    chat: document.getElementById('chat-history'),
    input: document.getElementById('user-input'),
    send: document.getElementById('send-btn'),
    mic: document.getElementById('mic-btn'),
    notes: document.getElementById('notes-list'),
    voiceToggle: document.getElementById('voice-toggle'),
    clearNotes: document.getElementById('clear-notes')
};

let teacher;
let lastResponse = "";

async function init() {
    try {
        elements.progress.style.display = 'block';
        // Using a very stable, small model for high compatibility
        teacher = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-78M', {
            progress_callback: (data) => {
                if (data.status === 'progress') {
                    elements.progress.value = data.progress;
                    elements.status.innerText = `Downloading Brain: ${Math.round(data.progress)}%`;
                }
            }
        });

        elements.status.innerText = "Teacher is Ready ✅";
        elements.progress.style.display = 'none';
        document.getElementById('status-dot').style.background = '#22c55e';
        
        checkFirstRun();
        renderNotes();
    } catch (e) {
        console.error(e);
        elements.status.innerText = "Load Failed. Please use Chrome/Edge and check internet.";
    }
}

function checkFirstRun() {
    if (!localStorage.getItem('onboarded')) {
        const welcome = "Hello! Dear, Welcome to ForraCorp Academy, a place where we believe knowledge is for the living. I am your AI Personal Teacher. I'm now fully downloaded into your browser, which means I can teach you even when you're offline. What would you like to learn today?";
        appendMessage('Teacher', welcome, 'bot-msg');
        speak(welcome);
        localStorage.setItem('onboarded', 'true');
    }
}

async function askTeacher() {
    const question = elements.input.value.trim();
    if (!question || !teacher) return;

    appendMessage('You', question, 'user-msg');
    elements.input.value = '';

    const prompt = `Instruction: You are a professional teacher. Explain clearly: ${question}`;

    try {
        const result = await teacher(prompt, { max_new_tokens: 200, temperature: 0.7 });
        lastResponse = result[0].generated_text;
        
        const html = marked.parse(lastResponse);
        const btn = `<br><button onclick="saveNote('${question.replace(/'/g, "\\'")}')" class="save-btn">💾 Save</button>`;
        
        appendMessage('Teacher', html + btn, 'bot-msg');
        if (elements.voiceToggle.checked) speak(lastResponse);
    } catch (err) {
        appendMessage('Teacher', "Brain freeze! Try again.", 'bot-msg');
    }
}

function speak(text) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utt);
}

window.saveNote = function(topic) {
    const notes = JSON.parse(localStorage.getItem('ai_notes') || '[]');
    notes.unshift({ topic, content: lastResponse });
    localStorage.setItem('ai_notes', JSON.stringify(notes));
    renderNotes();
};

function renderNotes() {
    const notes = JSON.parse(localStorage.getItem('ai_notes') || '[]');
    elements.notes.innerHTML = notes.map(n => `
        <div class="note-card">
            <strong>${n.topic}</strong>
            <p>${n.content}</p>
        </div>
    `).join('');
}

elements.clearNotes.onclick = () => {
    if(confirm("Clear notebook?")) { localStorage.removeItem('ai_notes'); renderNotes(); }
};

// Mic Support
const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Rec) {
    const recognition = new Rec();
    recognition.onresult = (e) => { elements.input.value = e.results[0][0].transcript; askTeacher(); };
    elements.mic.onclick = () => recognition.start();
}

elements.send.onclick = askTeacher;
init();
