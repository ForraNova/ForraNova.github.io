import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

// --- GITHUB PAGES COMPATIBILITY CONFIG ---
env.allowLocalModels = false; 
env.useBrowserCache = true;
env.remoteHost = 'https://huggingface.co';
env.remotePathComponent = 'models';

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

/**
 * INITIALIZATION
 */
async function init() {
    try {
        elements.progress.style.display = 'block';
        elements.status.innerText = "Initializing teacher engine...";

        // Load the model
        teacher = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-78M', {
            progress_callback: (data) => {
                if (data.status === 'progress') {
                    elements.progress.value = data.progress;
                    elements.status.innerText = `Downloading Brain: ${Math.round(data.progress)}%`;
                }
                if (data.status === 'ready') {
                    elements.status.innerText = "Teacher is Ready ✅";
                    elements.progress.style.display = 'none';
                    document.getElementById('status-dot').style.background = '#22c55e';
                }
            }
        });

        checkFirstRun();
        renderNotes();
    } catch (e) {
        console.error("Critical AI Load Error:", e);
        elements.status.innerHTML = `Load Failed. <button onclick="forceReset()" style="background:#ef4444; padding:2px 5px; font-size:10px;">Click to Reset Cache</button>`;
    }
}

/**
 * TEACHER LOGIC
 */
async function askTeacher() {
    const question = elements.input.value.trim();
    if (!question || !teacher) return;

    appendMessage('You', question, 'user-msg');
    elements.input.value = '';

    const prompt = `Instruction: Act as a professional teacher. Explain this simply: ${question}`;

    try {
        const result = await teacher(prompt, { 
            max_new_tokens: 200, 
            temperature: 0.7,
            repetition_penalty: 1.2
        });
        
        lastResponse = result[0].generated_text;
        
        // Render with Markdown (marked.js)
        const html = marked.parse(lastResponse);
        const saveBtn = `<br><button onclick="saveNote('${question.replace(/'/g, "\\'")}')" class="save-btn">💾 Save Lesson</button>`;
        
        appendMessage('Teacher', html + saveBtn, 'bot-msg');
        if (elements.voiceToggle.checked) speak(lastResponse);
    } catch (err) {
        appendMessage('Teacher', "I'm having trouble thinking. Let's try that again.", 'bot-msg');
    }
}

/**
 * UTILITIES (Voice, Notes, UI)
 */
function speak(text) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.0;
    window.speechSynthesis.speak(utt);
}

window.saveNote = function(topic) {
    const notes = JSON.parse(localStorage.getItem('pro_teacher_notes') || '[]');
    notes.unshift({ topic, content: lastResponse, date: new Date().toLocaleDateString() });
    localStorage.setItem('pro_teacher_notes', JSON.stringify(notes));
    renderNotes();
};

function renderNotes() {
    const notes = JSON.parse(localStorage.getItem('pro_teacher_notes') || '[]');
    elements.notes.innerHTML = notes.map(n => `
        <div class="note-card">
            <strong>${n.topic}</strong>
            <div style="font-size:0.85rem; color:#444;">${marked.parse(n.content)}</div>
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

function checkFirstRun() {
    if (!localStorage.getItem('teacher_onboarded')) {
        const welcome = "Hello! Dear, Welcome to ForraCorp Academy, a place where we believe \"knowledge is for the living\". I am your AI Personal Teacher. I'm now fully downloaded into your browser, which means I can teach you even when you're offline. What would you like to learn today?";
        appendMessage('Teacher', welcome, 'bot-msg');
        speak(welcome);
        localStorage.setItem('teacher_onboarded', 'true');
    }
}

// TROUBLESHOOTING: Force Reset
window.forceReset = async function() {
    if (confirm("This will clear the AI cache and redownload the brain. Continue?")) {
        const cachesKeys = await caches.keys();
        for (const key of cachesKeys) { await caches.delete(key); }
        localStorage.clear();
        location.reload();
    }
};

/**
 * MICROPHONE SUPPORT
 */
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Recognition) {
    const rec = new Recognition();
    rec.onresult = (e) => { elements.input.value = e.results[0][0].transcript; askTeacher(); };
    elements.mic.onclick = () => {
        rec.start();
        elements.status.innerText = "Listening...";
    };
}

/**
 * EVENT LISTENERS
 */
elements.send.onclick = askTeacher;
elements.input.onkeypress = (e) => { if (e.key === 'Enter') askTeacher(); };
elements.clearNotes.onclick = () => {
    if(confirm("Wipe all saved lessons?")) {
        localStorage.removeItem('pro_teacher_notes');
        renderNotes();
    }
};

// Start the app
init();
