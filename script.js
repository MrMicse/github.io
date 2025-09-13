
// Элементы DOM
const bankEl = document.getElementById("bank");
const betInput = document.getElementById("bet");
const levelEl = document.getElementById("level");
const multiplierEl = document.getElementById("multiplier");
const gameButtons = document.querySelectorAll(".game-btn");
const resultEl = document.querySelector(".result");

// контейнер для анимаций
const coinAnimationContainer = document.createElement('div');
coinAnimationContainer.className = 'coin-animation-container';
document.body.appendChild(coinAnimationContainer);

// Функции для работы с банком
// Загрузка при старте
function loadBank() {
    const savedBank = localStorage.getItem('gameBank');
    const value = parseInt(savedBank);
    return isNaN(value) ? 1000 : value;
}

// Функция сохранения коинов
function saveBank() {
    localStorage.setItem('gameBank', bank.toString());
}

// Обновление с автосохранением
function updateBank(newValue) {
    bank = Math.max(0, newValue); // Гарантируем, что значение не будет меньше 0
    bankEl.textContent = bank;
    saveBank();
}

// Настройки игры
// Инициализируем игровые переменные
let bank = loadBank(); // Загружаем сохраненные коины
bankEl.textContent = bank; // Обновляем отображение
let currentLevel = 1;
const multipliers = [1.2, 1.5, 1.8, 2.0, 2.5, 3.0, 4.0, 5.0, 7.0, 10.0]; // 10 уровней
const MAX_LEVEL = multipliers.length;
const SUPER_GAME_MULTIPLIER = 15;
// Текущая активная ставка
let activeBet = 0;

// Устанавливаем начальные значения
bankEl.textContent = bank;
levelEl.textContent = currentLevel;
multiplierEl.textContent = `x${multipliers[currentLevel - 1]}`;
betInput.focus();

// Фокус на поле ввода при загрузке
betInput.focus();

// Обработчик изменения ставки
betInput.addEventListener("input", function() {
    const bet = parseInt(this.value);
    
    // Сбрасываем предыдущую активную ставку
    activeBet = 0;
    gameButtons.forEach(btn => btn.disabled = true);
    
    // Проверяем валидность ставки
    if (isNaN(bet) || bet <= 0) {
        resultEl.textContent = "Введите корректную ставку";
        return;
    }
    
    // Проверяем наличие средств
    if (bank === 0) {
        resultEl.textContent = "😢 У вас нет коинов!";
        return;
    }
    
    if (bet > bank) {
        showNoCoinsAnimation();
        return;
    }
    
    // Если все проверки пройдены
    gameButtons.forEach(btn => btn.disabled = false);
    activeBet = bet;
    resultEl.textContent = `Ставка: ${bet} коинов`;
});

// Новая функция для анимации недостатка коинов
function showNoCoinsAnimation() {
    Sound.play('error');
    resultEl.textContent = "❌ Недостаточно коинов!";
    resultEl.classList.add('shake-animation');
    
    // Создаем эффект "рассыпающихся монет"
    for (let i = 0; i < 8; i++) {
        const coin = document.createElement('div');
        coin.className = 'no-coins-coin';
        coin.style.left = `${Math.random() * 100}%`;
        coin.style.top = '0';
        coin.style.setProperty('--fall-distance', `${100 + Math.random() * 50}px`);
        coin.style.setProperty('--fall-delay', `${i * 0.1}s`);
        resultEl.appendChild(coin);
        
        setTimeout(() => coin.remove(), 2000);
    }
    
    setTimeout(() => {
        resultEl.classList.remove('shake-animation');
    }, 500);
}

// Обработчик клика по игровым кнопкам
gameButtons.forEach(btn => {
    btn.addEventListener("click", function() {
        // Звук
        Sound.play('click');
        // Двойная проверка перед списанием средств
        if (activeBet <= 0 || bank < activeBet) {
            resultEl.textContent = "Ошибка: недостаточно средств";
            return;
        }
        
        // Блокируем кнопки на время игры
        gameButtons.forEach(btn => btn.disabled = true);
        
        // Списываем ставку
        updateBank(bank - activeBet);
        
        prepareButtons();
        
        // Начиная с 5 уровня - 2 мины (33% шанс)
        const minesCount = currentLevel >= 6 ? 2 : 1;
        setMines(minesCount);

        // Показываем предупреждение о 2 минах при 5+ уровне
        if (currentLevel === 5) {
            showWarning("Внимание! С 6 уровня 2 мины (шанс 33%)", 2000);
        }
        
        if (this.dataset.safe === "true") {
            Sound.play('coins');
            const winAmount = Math.floor(activeBet * multipliers[currentLevel - 1]);
            
            // Анимация прибавления монет
            createCoinAnimation(this, winAmount);
            
            // Анимация изменения числа
            animateValue(bank, bank + winAmount, 1000, (value) => {
                bankEl.textContent = value;
            });
            
            updateBank(bank + winAmount);
            resultEl.innerHTML = `🎉 Выиграли ${winAmount} коинов!`;
            
            currentLevel++;
            levelEl.textContent = currentLevel;
            multiplierEl.textContent = `x${multipliers[currentLevel - 1]}`;
            
            if (currentLevel > MAX_LEVEL) {
                resultEl.innerHTML += "<br>🎊 Вы прошли все уровни! Начинаем сначала!";
                currentLevel = 1;
            }
        } else {
            createBombAnimation(this);
            Sound.play('explosion');
            resultEl.textContent = "💣 БОМБА! Ставка сгорела";
            currentLevel = 1;
            levelEl.textContent = currentLevel;
            multiplierEl.textContent = `x${multipliers[currentLevel - 1]}`;
        }
        
        // Сбрасываем кнопки для следующего хода
        setTimeout(() => {
            prepareButtons();
            // Обновляем доступность кнопок на основе текущей ставки
            const currentBet = parseInt(betInput.value);
            if (!isNaN(currentBet)) {
                betInput.dispatchEvent(new Event('input'));
            }
        }, 1000);
    });
});

// Устанавливаем мины
function setMines(count) {
    // Сначала все кнопки безопасные
    gameButtons.forEach(btn => btn.dataset.safe = "true");
    
    // Выбираем случайные кнопки как мины
    const mineIndexes = [];
    while (mineIndexes.length < count) {
        const randomIndex = Math.floor(Math.random() * gameButtons.length);
        if (!mineIndexes.includes(randomIndex)) {
            mineIndexes.push(randomIndex);
            gameButtons[randomIndex].dataset.safe = "false";
        }
    }
}

// Анимация бомбы
function createBombAnimation(element) {
    const bomb = document.createElement('div');
    bomb.className = 'bomb-animation';
    const rect = element.getBoundingClientRect();
    
    // Позиционируем бомбу по центру кнопки
    bomb.style.cssText = `
        position: fixed;
        left: ${rect.left + rect.width/2 - 25}px;
        top: ${rect.top + rect.height/2 - 25}px;
        width: 50px;
        height: 50px;
        background-image: url('screenshots/bomb.png');
        background-size: contain;
        background-repeat: no-repeat;
        z-index: 1000;
        transform-origin: center;
        animation: bomb-pulse 0.3s infinite alternate;
    `;
    
    document.body.appendChild(bomb);
    
    // Анимация взрыва
    setTimeout(() => {
        bomb.style.animation = 'none';
        bomb.style.backgroundImage = 'none';
        bomb.style.backgroundColor = 'transparent';
        
        // Создаем эффект взрыва
        const explosion = document.createElement('div');
        explosion.className = 'explosion-effect';
        explosion.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width/2 - 50}px;
            top: ${rect.top + rect.height/2 - 50}px;
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255,100,0,0.8) 0%, rgba(255,50,0,0) 70%);
            z-index: 999;
            transform: scale(0);
            animation: explosion-grow 0.5s forwards;
        `;
        
        document.body.appendChild(explosion);
        
        // Осколки
        createExplosionDebris(rect.left + rect.width/2, rect.top + rect.height/2);
        
        // Удаляем элементы после анимации
        setTimeout(() => {
            bomb.remove();
            explosion.remove();
        }, 1000);
    }, 800);
}

// Создание осколков взрыва
function createExplosionDebris(centerX, centerY) {
    for (let i = 0; i < 12; i++) {
        const debris = document.createElement('div');
        debris.className = 'explosion-debris';
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 50;
        const size = 5 + Math.random() * 10;
        
        debris.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY}px;
            width: ${size}px;
            height: ${size}px;
            background-color: ${['#ff6600', '#ff3300', '#ff9900', '#cc3300'][Math.floor(Math.random() * 4)]};
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            transform: rotate(${Math.random() * 360}deg);
            animation: debris-fly-${i} 0.8s forwards;
            z-index: 1000;
        `;
        
        // Динамическое создание keyframes для каждого осколка
        const style = document.createElement('style');
        style.textContent = `
            @keyframes debris-fly-${i} {
                to {
                    transform: translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) rotate(${360 + Math.random() * 360}deg);
                    opacity: 0;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(debris);
        
        setTimeout(() => {
            debris.remove();
            style.remove();
        }, 800);
    }
}


// Остальные функции остаются без изменений
function createCoinAnimation(element, coinsCount) {
    const btnRect = element.getBoundingClientRect();
    const bankRect = bankEl.getBoundingClientRect();
    
    const coinsToCreate = Math.min(15, Math.max(10, Math.floor(coinsCount / 20)));
    
    for (let i = 0; i < coinsToCreate; i++) {
        const coin = document.createElement('div');
        coin.className = 'coin-animation';
        
        const startX = btnRect.left + btnRect.width / 2 - 15;
        const startY = btnRect.top + btnRect.height / 2 - 15;
        const endX = bankRect.left + bankRect.width / 2 - 15;
        const endY = bankRect.top + bankRect.height / 2 - 15;
        const randomX = Math.random() * 100 - 50;
        const randomY = Math.random() * 100 - 50;
        
        coin.style.left = `${startX}px`;
        coin.style.top = `${startY}px`;
        coin.style.setProperty('--random-x', `${endX - startX + randomX}px`);
        coin.style.setProperty('--random-y', `${endY - startY + randomY}px`);
        
        coinAnimationContainer.appendChild(coin);
        
        setTimeout(() => coin.remove(), 1000);
    }
}

function prepareButtons() {
    gameButtons.forEach(btn => {
        btn.dataset.safe = "true";
        btn.classList.remove("mine");
    });
}

function animateValue(start, end, duration, callback) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.floor(start + (end - start) * progress);
        callback(value);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Новая функция для показа предупреждений
function showWarning(message, duration) {
    const warning = document.createElement('div');
    warning.className = 'level-warning';
    warning.textContent = message;
    document.body.appendChild(warning);
    
    setTimeout(() => {
        warning.classList.add('fade-out');
        setTimeout(() => warning.remove(), 500);
    }, duration);
}

// Рестарт
document.getElementById('resetBank').addEventListener('click', () => {
    Sound.play('reset');
    updateBank(1000);
    currentLevel = 1;
    levelEl.textContent = currentLevel;
    multiplierEl.textContent = `x${multipliers[currentLevel - 1]}`;
    alert("Прогресс сброшен! Банк: 1000 коинов");
});


// Audio Manager
const Sound = {
    init: function() {
        this.sounds = {
            click: new Audio('sounds/click.wav'),
            error: new Audio('sounds/error.wav'),
            coins: new Audio('sounds/coins.wav'),
            explosion: new Audio('sounds/explosion.wav'),
            reset: new Audio('sounds/reset.wav')
        };
        
        // Настройки громкости
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.6; // Стандартная громкость
        });
        this.sounds.explosion.volume = 0.7; // Взрыв чуть громче
    },
    
    play: function(name) {
        if (this.sounds[name]) {
            this.sounds[name].currentTime = 0; // Перемотка для мгновенного воспроизведения
            this.sounds[name].play().catch(e => console.log("Auto-play prevented:", e));
        }
    }
};

// Инициализация при загрузке
Sound.init();

let soundEnabled = true;
document.getElementById('soundToggle').addEventListener('click', function() {
    soundEnabled = !soundEnabled;
    this.textContent = soundEnabled ? "🔊" : "🔇";
    Object.values(Sound.sounds).forEach(s => s.muted = !soundEnabled);
});

function createAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    
    return function(name, xPos) {
        if (!soundEnabled) return;
        
        const sound = Sound.sounds[name].cloneNode();
        const panner = new StereoPannerNode(ctx, { pan: xPos * 0.8 });
        
        sound.connect(panner)
            .connect(ctx.destination);
        sound.start();
    };

}

