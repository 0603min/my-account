const API = 'https://script.google.com/macros/s/AKfycbzLAWeTRW4efS5NHRXrYD9Hd5qZGsBeV7U6IMRf-EOxLPP9IO4cVPjpSzyGntwRjwd1eg/exec'; 

// --- 1. 主題切換邏輯 ---
function toggleTheme() {
    const root = document.documentElement;
    const isDark = root.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    document.getElementById('themeToggle').innerText = newTheme === 'dark' ? '☀️' : '🌙';
}

// --- 2. 預設時間設定 ---
function setDefaultTime() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - offset)).toISOString().slice(0, 16);
    const timeInput = document.getElementById('time');
    if(timeInput) timeInput.value = localISOTime;
}

// --- 3. 抓取資料 ---
async function fetchData() {
    showLoading(true);
    try {
        const res = await fetch(API);
        const data = await res.json();
        render(data);
    } catch (e) { console.error("抓取失敗", e); }
    showLoading(false);
}

// --- 4. 傳送資料 ---
async function sendData(type) {
    const desc = document.getElementById('desc').value;
    const amount = document.getElementById('amt').value;
    const time = document.getElementById('time').value;
    const category = document.getElementById('category').value;

    if(!desc || !amount || !time) return alert('請完整填寫 📝');

    showLoading(true);
    try {
        await fetch(API, { 
            method: 'POST', 
            body: JSON.stringify({ desc, amount: Number(amount), type, customDate: time, category }) 
        });
        location.reload();
    } catch (e) { alert("傳送失敗"); showLoading(false); }
}

// --- 5. 渲染畫面 ---
function render(data) {
    let b = 0;
    const list = document.getElementById('list');
    const categoryIcons = { "飲食":"🍔", "飲料":"🥤", "交通":"🛵", "固定":"🗓️", "投資":"📈", "社交":"🎁", "其他":"🛠️" };

    list.innerHTML = data.reverse().map((i, index) => {
        const isInc = i.type === 'income';
        b += isInc ? Number(i.amount) : -Number(i.amount);
        const icon = categoryIcons[i.category] || "💰";
        const dateStr = new Date(i.date).toLocaleDateString();
        
        return `
            <div class="glass-ui p-4 flex justify-between items-center" style="animation: slideUp 0.5s ease forwards; animation-delay: ${index * 0.05}s; opacity: 0;">
                <div>
                    <b class="text-primary-custom text-lg">${icon} ${i.desc}</b>
                    <p class="text-xs text-secondary-custom">${dateStr} · ${i.category}</p>
                </div>
                <span class="${isInc?'text-emerald-500':'text-rose-500'} font-bold text-xl">
                    ${isInc?'+':'-'}$${Number(i.amount).toLocaleString()}
                </span>
            </div>`;
    }).join('');
    document.getElementById('balance').innerText = `$ ${b.toLocaleString()}`;
}

// --- 6. 載入進度條 ---
function showLoading(show) {
    const bar = document.getElementById('loadingBar');
    if (show) { bar.style.width = '70%'; document.body.style.opacity = '0.7'; }
    else { bar.style.width = '100%'; setTimeout(() => { bar.style.width = '0'; document.body.style.opacity = '1'; }, 300); }
}

// --- 7. Canvas 背景 ---
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
function initCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1; this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3; this.alpha = Math.random() * 0.5;
    }
    update() { this.x += this.speedX; this.y += this.speedY; if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset(); }
    draw() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        ctx.fillStyle = isDark ? `rgba(147, 197, 253, ${this.alpha})` : `rgba(99, 102, 241, ${this.alpha})`;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
    }
}
function animate() { ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); p.draw(); }); requestAnimationFrame(animate); }

// --- 啟動 ---
window.onload = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('themeToggle').innerText = savedTheme === 'dark' ? '☀️' : '🌙';
    initCanvas();
    window.addEventListener('resize', initCanvas);
    for(let i=0; i<60; i++) particles.push(new Particle());
    animate();
    setDefaultTime();
    fetchData();
};