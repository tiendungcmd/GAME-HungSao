const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
const restartButton = document.getElementById('restartButton');
const scoreDisplay = document.getElementById('score');
const leaderboardList = document.getElementById('leaderboardList');
const loginButton = document.getElementById('loginButton');
const skipLoginButton = document.getElementById('skipLoginButton');

// Facebook SDK - Khởi tạo và kiểm tra đăng nhập
window.fbAsyncInit = function() {
    FB.init({
        appId      :  966097475553804, // Thay YOUR_APP_ID bằng App ID của bạn
        cookie     : true,
        xfbml      : true,
        version    : 'v13.0'
    });

    FB.getLoginStatus(function(response) {
        handleLoginStatus(response);
    });
};

// Nút đăng nhập Facebook
loginButton.onclick = function() {
    FB.login(function(response) {
        handleLoginStatus(response);
    }, {scope: 'user_friends'});
};

// Xử lý trạng thái đăng nhập Facebook
function handleLoginStatus(response) {
    if (response.status === 'connected') {
        loginButton.style.display = 'none';
        skipLoginButton.style.display = 'none';
        loadFriendsLeaderboard();
    } else {
        loginButton.style.display = 'block';
        skipLoginButton.style.display = 'block';
    }
}

// Bỏ qua đăng nhập
function skipLogin() {
    loginButton.style.display = 'none';
    skipLoginButton.style.display = 'none';
    displayLeaderboard([]);
}

// Lấy danh sách bạn bè và hiển thị bảng xếp hạng
function loadFriendsLeaderboard() {
    FB.api('/me/friends', function(response) {
        if (response && !response.error) {
            const friends = response.data;
            const leaderboard = getFriendScores(friends);
            displayLeaderboard(leaderboard);
        } else {
            console.error('Lỗi khi lấy danh sách bạn bè:', response.error);
        }
    });
}

// Giả lập điểm số của bạn bè
function getFriendScores(friends) {
    return friends.map(friend => ({
        name: friend.name,
        score: Math.floor(Math.random() * 100) // Điểm số ngẫu nhiên cho ví dụ
    })).sort((a, b) => b.score - a.score);
}

// Hiển thị bảng xếp hạng bạn bè
function displayLeaderboard(leaderboard) {
    leaderboardList.innerHTML = '';
    leaderboard.forEach((friend, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${index + 1}. ${friend.name} - Điểm: ${friend.score}`;
        leaderboardList.appendChild(listItem);
    });
}

// Game hứng sao
const player = {
    x: canvasWidth / 2,
    y: canvasHeight - 50,
    width: 40,
    height: 40,
    speed: 5,
    image: new Image()
};
player.image.src = 'basket.png'; // Đường dẫn đến hình cái giỏ

let keys = {};
document.addEventListener('keydown', (e) => { keys[e.key] = true; });
document.addEventListener('keyup', (e) => { keys[e.key] = false; });

function movePlayer() {
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x + player.width < canvasWidth) player.x += player.speed;
}

let stars = [];
let effects = []; // Mảng để lưu các hiệu ứng nổ sáng
const starSize = 20;
let score = 0;
let starSpeed = 3;
let starSpawnInterval = 1000;
let gameOver = false;

function createStar() {
    const x = Math.random() * (canvasWidth - starSize);
    stars.push({ x, y: 0, radius: starSize / 2, color: '#ffd700' });
}

function moveStars() {
    for (let i = stars.length - 1; i >= 0; i--) {
        stars[i].y += starSpeed;
        if (stars[i].y - stars[i].radius > canvasHeight) {
            gameOver = true;
            saveScore(score);
            restartButton.style.display = 'block';
            return;
        }
    }
}

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

// Tạo hiệu ứng khi hứng được sao
function createEffect(x, y) {
    effects.push({
        x: x,
        y: y,
        radius: 10,
        opacity: 1.0
    });
}

// Di chuyển và làm mờ dần hiệu ứng
function updateEffects() {
    for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        effect.radius += 2;
        effect.opacity -= 0.05;
        if (effect.opacity <= 0) {
            effects.splice(i, 1);
        }
    }
}

// Vẽ các hiệu ứng nổ sáng
function drawEffects() {
    effects.forEach(effect => {
        ctx.fillStyle = `rgba(255, 215, 0, ${effect.opacity})`;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

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

function drawPlayer() {
    ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

function drawStars() {
    stars.forEach(star => {
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

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

function gameLoop() {
    update();
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}
gameLoop();

function restartGame() {
    gameOver = false;
    score = 0;
    starSpeed = 3;
    starSpawnInterval = 1000;
    stars = [];
    effects = [];
    scoreDisplay.textContent = score;
    restartButton.style.display = 'none';
    clearInterval(spawnInterval);
    spawnInterval = setInterval(createStar, starSpawnInterval);
    gameLoop();
}

function saveScore(newScore) {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    leaderboard.push(newScore);
    leaderboard.sort((a, b) => b - a);
    leaderboard = leaderboard.slice(0, 5);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    displayLeaderboard([]);
}
