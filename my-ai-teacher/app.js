import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

// --- GITHUB PAGES COMPATIBILITY OVERRIDE ---
env.allowLocalModels = false; 
env.useBrowserCache = true;

/** * CRITICAL FIX: GitHub Pages often blocks 'resolve' links.
 * We force the engine to use the most direct CDN path.
 */
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
 * INITIALIZATION ENGINE
 */
async function init() {
    try {
        elements.progress.style.display = 'block';
        elements.status.innerText = "Waking up the brain engine...";

        // Load the model with 'revision' to bypass cache-redirect blocks
        teacher = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-78M', {
            revision: 'main', 
            progress_callback: (data) => {
                if (data.status === 'progress') {
                    elements.progress.value = data.progress;
                    elements.status.innerText = `Connecting: ${Math.round(data.progress)}%`;
                }
                if (data.status === 'ready') {
                    elements.status.innerText = "Teacher is Ready ✅";
                    elements.progress.style.display = 'none';
                    const dot = document.getElementById('status-dot');
                    if(dot) dot.style.background = '#22c55e';
                    
                    checkFirstRun();
                }
            }
        });

        renderNotes();
    } catch (e) {
        console.error("Critical AI Load Error:", e);
        // Error handling for 401/403 Unauthorized
        elements.status.innerHTML = `
            Brain Blocked. <button onclick="forceReset()" style="background:#ef4444; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;">Clear Cache & Retry</button>
            <p style="font-size:10px; color:gray; margin-top:5px;">Check if you're in Incognito mode or have AdBlock on.</p>
        `;
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

    const prompt = `Instruction: Act as a professional teacher. Explain this concept simply: ${question}`;

    try {
        const result = await teacher(prompt, { 
            max_new_tokens: 250, 
            temperature: 0.7,
            repetition_penalty: 1.2
        });
        
        lastResponse = result[0].generated_text;
        
        const html = marked.parse(lastResponse);
        const saveBtn = `<br><button onclick="saveNote('${question.replace(/'/g, "\\'")}')" class="save-btn">💾 Save Lesson</button>`;
        
        appendMessage('Teacher', html + saveBtn, 'bot-msg');
        
        if (elements.voiceToggle && elements.voiceToggle.checked) {
            speak(lastResponse);
        }
    } catch (err) {
        appendMessage('Teacher', "I'm having trouble thinking. Let's try that again.", 'bot-msg');
    }
}

/**
 * UTILITIES
 */
function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.0;
    window.speechSynthesis.speak(utt);
}

window.saveNote = function(topic) {
    const notes = JSON.parse(localStorage.getItem('pro_teacher_notes') || '[]');
    notes.unshift({ 
        topic, 
        content: lastResponse, 
        date: new Date().toLocaleDateString() 
    });
    localStorage.setItem('pro_teacher_notes', JSON.stringify(notes));
    renderNotes();
};

function renderNotes() {
    if (!elements.notes) return;
    const notes = JSON.parse(localStorage.getItem('pro_teacher_notes') || '[]');
    elements.notes.innerHTML = notes.map(n => `
        <div class="note-card">
            <strong>${n.topic}</strong>
            <div style="font-size:0.85rem; color:#444;">${marked.parse(n.content)}</div>
            <small style="color:#999;">${n.date}</small>
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
        const welcome = "Hello! Dear, Welcome to ForraCorp Academy, a place where we believe knowledge is for the living. I am your AI Personal Teacher. I'm now fully downloaded into your browser, which means I can teach you even when you're offline. What would you like to learn today?";
        appendMessage('Teacher', welcome, 'bot-msg');
        speak(welcome);
        localStorage.setItem('teacher_onboarded', 'true');
    }
}

window.forceReset = async function() {
    if (confirm("Delete brain cache and restart? (Fixes most errors)")) {
        localStorage.clear();
        if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(key => caches.delete(key)));
        }
        location.reload();
    }
};

/**
 * INPUT LISTENERS
 */
if (elements.send) elements.send.onclick = askTeacher;
if (elements.input) {
    elements.input.onkeypress = (e) => { if (e.key === 'Enter') askTeacher(); };
}

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Recognition && elements.mic) {
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

if (elements.clearNotes) {
    elements.clearNotes.onclick = () => {
        if(confirm("Wipe all saved lessons?")) {
            localStorage.removeItem('pro_teacher_notes');
            renderNotes();
        }
    };
}

init();
