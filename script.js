// Настройки игры
let bank = 1000;
let currentLevel = 1;
const multipliers = [1.5, 2, 2.5, 3, 4];
const MAX_LEVEL = multipliers.length;
const SUPER_GAME_MULTIPLIER = 10;

// Элементы DOM
const bankEl = document.getElementById("bank");
const betInput = document.getElementById("bet");
const levelEl = document.getElementById("level");
const multiplierEl = document.getElementById("multiplier");
const gameButtons = document.querySelectorAll(".game-btn");
const resultEl = document.querySelector(".result");
const superGameModal = document.getElementById("superGameModal");
const acceptSuperGameBtn = document.getElementById("acceptSuperGame");
const declineSuperGameBtn = document.getElementById("declineSuperGame");

// Фокус на поле ввода при загрузке
betInput.focus();

// Обработчик ввода ставки
betInput.addEventListener("input", () => {
    const bet = parseInt(betInput.value);
    
    // Активируем кнопки только если ставка валидна
    if (!isNaN(bet) && bet > 0 && bet <= bank) {
        gameButtons.forEach(btn => btn.disabled = false);
    } else {
        gameButtons.forEach(btn => btn.disabled = true);
    }
});

// Обработчик клика по игровым кнопкам
gameButtons.forEach(btn => {
    btn.addEventListener("click", function() {
        const bet = parseInt(betInput.value);
        
        if (isNaN(bet) || bet <= 0 || bet > bank) {
            resultEl.textContent = "Введите корректную ставку!";
            return;
        }
        
        bank -= bet;
        bankEl.textContent = bank;
        betInput.disabled = true;
        
        playRound(bet);
    });
});

// Игровой раунд
function playRound(bet) {
    // Сброс кнопок
    gameButtons.forEach(btn => {
        btn.dataset.safe = "true";
        btn.classList.remove("mine");
    });

    // Выбираем 1 мину для обычного раунда
    const mineIndex = Math.floor(Math.random() * gameButtons.length);
    gameButtons[mineIndex].dataset.safe = "false";

    // Обработчик клика
const handleClick = (clickedBtn) => {
    const isSafe = clickedBtn.dataset.safe === "true";
    const bet = parseInt(betInput.value);

    if (isSafe) {
        // Расчет выигрыша с анимацией
        const winAmount = Math.floor(bet * multipliers[currentLevel - 1]);
        
        // Анимация подсчета
        animateValue(bank, bank + winAmount, 500, (value) => {
            bankEl.textContent = Math.floor(value);
        });
        
        bank += winAmount;
        resultEl.textContent = `🎉 Выигрыш: +${winAmount} монет!`;
        
        currentLevel++;
        levelEl.textContent = currentLevel;
        multiplierEl.textContent = `x${multipliers[currentLevel - 1]}`;
        
        if (currentLevel > MAX_LEVEL) {
            showSuperGameModal();
        } else {
            resetForNextRound();
        }
    } else {
        // Обработка проигрыша
        clickedBtn.classList.add("mine");
        resultEl.textContent = "💥 Ставка сгорела!";
        currentLevel = 1;
        levelEl.textContent = currentLevel;
        multiplierEl.textContent = `x${multipliers[currentLevel - 1]}`;
        setTimeout(resetAfterLoss, 1000);
    }
};

// Добавляем функцию анимации чисел
function animateValue(start, end, duration, callback) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        callback(value);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

    // Вешаем обработчики
    gameButtons.forEach(btn => {
        btn.onclick = () => handleClick(btn);
    });
}





// Супер-игра






// Сброс после проигрыша
function resetAfterLoss() {
    gameButtons.forEach(btn => {
        btn.disabled = true;
        btn.classList.remove("mine");
    });
    betInput.disabled = false;
    betInput.value = "";
    betInput.focus();
}

// Сброс для следующего раунда
function resetForNextRound() {
    gameButtons.forEach(btn => {
        btn.disabled = true;
    });
    betInput.disabled = false;
    betInput.value = "";
    betInput.focus();
}