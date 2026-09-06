// === НАСТРОЙКА СВЯЗИ С ОБЛАКОМ ===
const SUPABASE_URL = "https://supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_dQ4TmNQhbRWNjniBhfe2mg_QxRFNpoZ"; 

let mge_db = null;

// Жесткая и правильная инициализация через window.supabase
try {
    if (window.supabase) {
        mge_db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error("Библиотека Supabase не найдена в системе.");
    }
} catch (err) {
    console.error("Ошибка инициализации базы данных:", err);
}

const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatMessages = document.getElementById('chat-messages');
const chatNickname = document.getElementById('chat-nickname');
const setNicknameBtn = document.getElementById('set-nickname-btn');
const systemWelcome = document.getElementById('chat-system-welcome');
const clearChatBtn = document.getElementById('clear-chat-btn');

let isNicknameSet = false;
let isCooldownActive = false;

// Функция вывода системных ошибок на экран чата
function showScreenError(text) {
    const errEl = document.createElement('div');
    errEl.classList.add('chat-msg', 'system');
    errEl.style.borderLeftColor = "#ff0000";
    errEl.innerHTML = `<span class="msg-text" style="color: #ff0000; font-weight: bold;">❌ Ошибка: ${text}</span>`;
    chatMessages.appendChild(errEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Авторизация никнейма
setNicknameBtn.addEventListener('click', () => {
    const nick = chatNickname.value.trim();
    if (!nick) {
        alert("Брат, представься системе! Введи свой никнейм.");
        return;
    }
    localStorage.setItem("mge_nickname", nick);
    isNicknameSet = true;
    chatNickname.classList.add('saved');
    chatInput.disabled = false;
    chatSendBtn.disabled = false;
    chatInput.placeholder = "Напиши пацанам...";
    if(systemWelcome) {
        systemWelcome.querySelector('.msg-text').textContent = `🤖 Система: Успешное подключение под ником "${nick}". Загружаем общую историю...`;
    }
    loadChatMessages();
});

// ОТПРАВКА СООБЩЕНИЯ В ОБЛАКО
async function sendChatMessage() {
    if (!isNicknameSet || isCooldownActive) return;
    if (!mge_db) {
        showScreenError("База данных не инициализирована.");
        return;
    }
    
    const text = chatInput.value.trim();
    const nick = localStorage.getItem("mge_nickname") || "Анонимный Титан";
    if (!text) return;

    chatInput.value = ""; // Очищаем поле
    
    isCooldownActive = true;
    chatInput.disabled = true;
    chatSendBtn.disabled = true;
    
    let cooldownTime = 10;
    chatSendBtn.textContent = `${cooldownTime}с`;

    const cooldownInterval = setInterval(() => {
        cooldownTime--;
        if (cooldownTime > 0) {
            chatSendBtn.textContent = `${cooldownTime}с`;
        } else {
            clearInterval(cooldownInterval);
            isCooldownActive = false;
            chatInput.disabled = false;
            chatSendBtn.disabled = false;
            chatSendBtn.textContent = "Отправить";
            chatInput.focus();
        }
    }, 1000);

    const { error } = await mge_db
        .from('mge_chat')
        .insert([{ author: nick, text: text }]);

    if (error) {
        showScreenError(`Не удалось отправить: ${error.message}`);
    } else {
        loadChatMessages(); 
    }
}

chatSendBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter' && !isCooldownActive) sendChatMessage(); 
});

function appendMessageToHTML(msg) {
    const msgElement = document.createElement('div');
    msgElement.classList.add('chat-msg');
    msgElement.innerHTML = `
        <span class="msg-author">${msg.author}:</span>
        <span class="msg-text">${msg.text}</span>
    `;
    chatMessages.appendChild(msgElement);
}

// ЗАГРУЗКА ИЗ ОБЛАКА
async function loadChatMessages() {
    if (!mge_db) return;

    const { data, error } = await mge_db
        .from('mge_chat')
        .select('author, text')
        .order('id', { ascending: true })
        .limit(50);

    if (error) {
        showScreenError(`Ошибка загрузки истории: ${error.message}`);
        return;
    }

    chatMessages.innerHTML = '';
    data.forEach(msg => appendMessageToHTML(msg));
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
        if (confirm("Брат, очистить экран чата на твоем ПК?")) {
            chatMessages.innerHTML = '';
            const tempAlert = document.createElement('div');
            tempAlert.classList.add('chat-msg', 'system');
            tempAlert.style.transition = 'opacity 0.5s ease';
            tempAlert.innerHTML = `<span class="msg-text">🤖 Система: Экран успешно вычищен. Через секунду чат обновится.</span>`;
            chatMessages.appendChild(tempAlert);

            setTimeout(() => {
                tempAlert.style.opacity = '0';
                setTimeout(() => { 
                    tempAlert.remove(); 
                    loadChatMessages();
                }, 500);
            }, 2000);
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const savedNick = localStorage.getItem("mge_nickname");
    if (savedNick) {
        chatNickname.value = savedNick;
        chatNickname.classList.add('saved');
        chatInput.disabled = false;
        chatSendBtn.disabled = false;
        chatInput.placeholder = "Напиши пацанам...";
        isNicknameSet = true;
    }
    
    loadChatMessages();
    setInterval(loadChatMessages, 3000);

    const privacyModal = document.getElementById('mge-privacy-modal');
    const closePrivacyBtn = document.getElementById('close-privacy-btn');
    const isNoticeAccepted = localStorage.getItem("mge_privacy_accepted");

    if (!isNoticeAccepted && privacyModal && closePrivacyBtn) {
        privacyModal.classList.remove('hidden');
        let timeLeft = 3;
        const countdownTimer = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                closePrivacyBtn.textContent = timeLeft;
            } else {
                clearInterval(countdownTimer);
                closePrivacyBtn.disabled = false;
                closePrivacyBtn.textContent = "ПОНЯЛ, БРАТ 💪";
            }
        }, 1000);

        closePrivacyBtn.addEventListener('click', () => {
            localStorage.setItem("mge_privacy_accepted", "true");
            privacyModal.classList.add('hidden');
        });
    }
});
