const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restartButton');
const scoreDisplay = document.getElementById('score');

// Tự động điều chỉnh kích thước Canvas theo màn hình
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight - 150; // Chừa khoảng trống cho scoreboard và nút
canvas.width = canvasWidth;
canvas.height = canvasHeight;

// Khởi tạo nhân vật người chơi với hình cái giỏ
const player = {
    x: canvasWidth / 2,
    y: canvasHeight - 50,
    width: 40,
    height: 40,
    speed: 5,
    image: new Image()
};
player.image.src = 'basket.png'; // Đường dẫn đến hình cái giỏ

let score = 0;
let starSpeed = 3;
let starSpawnInterval = 1000;
let stars = [];
let effects = [];
let gameOver = false;
let keys = {};

// Điều khiển bàn phím
document.addEventListener('keydown', (e) => { keys[e.key] = true; });
document.addEventListener('keyup', (e) => { keys[e.key] = false; });

function movePlayer() {
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x + player.width < canvasWidth) player.x += player.speed;
}

// Điều khiển cảm ứng
canvas.addEventListener('touchstart', (e) => {
    let touchX = e.touches[0].clientX;
    if (touchX < player.x) {
        player.x -= player.speed * 2;
    } else {
        player.x += player.speed * 2;
    }
});

// Tạo sao ngẫu nhiên
function createStar() {
    const x = Math.random() * (canvasWidth - 20);
    stars.push({ x: x, y: 0, radius: 10, color: '#ffd700' });
}

// Di chuyển các ngôi sao
function moveStars() {
    for (let i = stars.length - 1; i >= 0; i--) {
        stars[i].y += starSpeed;
        if (stars[i].y - stars[i].radius > canvasHeight) {
            gameOver = true;
            saveScore(score);
            restartButton.style.display = 'block'; // Hiển thị nút "Chơi lại"
            return;
        }
    }
}

// Tạo hiệu ứng khi hứng được sao
function createEffect(x, y) {
    effects.push({ x: x, y: y, radius: 10, opacity: 1.0 });
}

// Cập nhật và xóa hiệu ứng
function updateEffects() {
    for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        effect.radius += 2;
        effect.opacity -= 0.05;
        if (effect.opacity <= 0) effects.splice(i, 1);
    }
}

// Kiểm tra va chạm giữa giỏ và sao
function checkCollision() {
    for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        const dx = player.x + player.width / 2 - star.x;
        const dy = player.y + player.height / 2 - star.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.width / 2 + star.radius) {
            createEffect(star.x, star.y);
            stars.splice(i, 1);
            score += 10;
            scoreDisplay.textContent = score;
            increaseDifficulty();
        }
    }
}

// Tăng độ khó khi đạt được điểm số
function increaseDifficulty() {
    if (score % 50 === 0) {
        starSpeed += 0.5;
        if (starSpawnInterval > 300) {
            starSpawnInterval -= 100;
            clearInterval(spawnInterval);
            spawnInterval = setInterval(createStar, starSpawnInterval);
        }
    }
}

// Vẽ giỏ
function drawPlayer() {
    ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

// Vẽ các ngôi sao
function drawStars() {
    stars.forEach(star => {
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Vẽ hiệu ứng
function drawEffects() {
    effects.forEach(effect => {
        ctx.fillStyle = `rgba(255, 215, 0, ${effect.opacity})`;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Cập nhật trò chơi
function update() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (!gameOver) {
        movePlayer();
        moveStars();
        updateEffects();
        checkCollision();
        drawPlayer();
        drawStars();
        drawEffects();
    }
}

let spawnInterval = setInterval(createStar, starSpawnInterval);

// Vòng lặp trò chơi
function gameLoop() {
    update();
    if (!gameOver) requestAnimationFrame(gameLoop);
}
gameLoop();

// Thiết lập lại trò chơi khi nhấn nút "Chơi lại"
function restartGame() {
    gameOver = false;
    score = 0;
    starSpeed = 3;
    starSpawnInterval = 1000;
    stars = [];
    effects = [];
    scoreDisplay.textContent = score;
    restartButton.style.display = 'none'; // Ẩn nút "Chơi lại"
    clearInterval(spawnInterval);
    spawnInterval = setInterval(createStar, starSpawnInterval);
    gameLoop();
}

// Lưu điểm số
function saveScore(newScore) {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    leaderboard.push(newScore);
    leaderboard.sort((a, b) => b - a);
    leaderboard = leaderboard.slice(0, 5);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}
