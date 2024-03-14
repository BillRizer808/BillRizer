// 获取 canvas 元素并设置绘图上下文
const canvas = document.getElementById('digitalRain');
const ctx = canvas.getContext('2d');

// 设置 canvas 尺寸为浏览器窗口尺寸
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 定义用于生成数字雨的字符集
const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const fontSize = 16; // 字符的大小
const columns = canvas.width / fontSize; // 根据画布宽度和字符大小计算列数

// 初始化一个数组来存储每一列字符的当前位置
const drops = Array.from({ length: columns }).fill(1);

// 用于 "password" 效果的变量
let attractMode = false; // 是否激活吸附模式
const attractPosition = { x: canvas.width / 2, y: canvas.height / 2 }; // 吸附中心点，设置为画布中心
const password = 'password'; // 吸附显示的文本
const passwordColumns = []; // 存储形成 "password" 的列索引
let passwordDrops = []; // 存储 "password" 文本的下落位置和当前字符

// 移动端特效变量
let mobileModeActivated = false;
let mobilePasswordEffectStarted = false;
const mobilePasswordStartTime = 3000; // 3秒后开始
let mobilePasswordCharIndex = 0; // 当前显示的 "password" 字符索引
let mobilePasswordLastUpdateTime = 0; // 上次更新 "password" 字符的时间
const mobilePasswordTotalDuration = 3000; // "password" 形成总持续时间为 3 秒
const mobilePasswordCharDuration = mobilePasswordTotalDuration / password.length; // 每个字符的出现间隔
let passwordFullyFormed = false; // "password" 是否完全形成

// 检查是否为移动设备
function isMobileDevice() {
    return /Mobi|Android/i.test(navigator.userAgent);
}

// 预先计算形成 "password" 文本的列索引并初始化下落位置
for (let i = 0; i < password.length; i++) {
    const columnIndex = Math.floor(attractPosition.x / fontSize) - Math.floor(password.length / 2) + i;
    passwordColumns.push(columnIndex);
    // 初始化 "password" 每个字符的下落位置和当前显示的字符
    passwordDrops.push({ y: 1, char: characters[Math.floor(Math.random() * characters.length)] });
}

// 主绘制函数，负责绘制数字雨和 "password" 效果
function draw() {
    // 使用半透明背景覆盖画布，创建尾迹效果
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 设置文本样式
    ctx.fillStyle = '#0F0'; // 文本颜色设置为绿色
    ctx.font = `${fontSize}px monospace`; // 设置字体

    // 遍历每列，绘制字符
    drops.forEach((drop, i) => {
        // 当鼠标靠近中心时，特定列下落 "password" 文本的字符
        if (attractMode && passwordColumns.includes(i)) {
            const index = passwordColumns.indexOf(i);
            const { y, char } = passwordDrops[index];
            // 下落到指定位置前显示随机字符，到达后显示最终字符
            const finalChar = y * fontSize >= attractPosition.y ? password[index] : char;
            ctx.fillText(finalChar, i * fontSize, y * fontSize);

            // 更新下一个字符或保持当前字符，直到到达指定位置
            if (y * fontSize < attractPosition.y) {
                passwordDrops[index] = {
                    y: y + 1,
                    char: characters[Math.floor(Math.random() * characters.length)]
                };
            }
        } else {
            // 正常绘制数字雨
            const text = characters.charAt(Math.floor(Math.random() * characters.length));
            ctx.fillText(text, i * fontSize, drop * fontSize);

            // 当字符超出画布底部时，重置其位置
            if (drop * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    });

    // 如果移动端特效被激活，绘制移动端特效
    if (mobileModeActivated && mobilePasswordEffectStarted) {
        drawMobilePasswordEffect();
    }
}

// 绘制移动端特效的函数
function drawMobilePasswordEffect() {
    const now = Date.now();

    // 逐步显示 "password" 字符
    if (mobilePasswordCharIndex < password.length &&
        now - mobilePasswordLastUpdateTime > mobilePasswordCharDuration) {
        const char = password[mobilePasswordCharIndex];
        const x = attractPosition.x - (fontSize * password.length / 2) + fontSize * mobilePasswordCharIndex;
        const y = attractPosition.y;

        ctx.fillText(char, x, y);

        mobilePasswordCharIndex++; // 移动到下一个字符
        mobilePasswordLastUpdateTime = now; // 更新时间

        if (mobilePasswordCharIndex === password.length) {
            passwordFullyFormed = true; // 标记 "password" 完全形成
            setTimeout(() => {
                mobileModeActivated = false; // 停止移动端特效，允许点击跳转
            }, 3000); // "password" 悬停 3 秒
        }
    } else if (passwordFullyFormed) {
        // 当 "password" 完全形成后，继续显示而不更新
		
        for (let i = 0; i < password.length; i++) {
            const char = password[i];
            const x = attractPosition.x - (fontSize * password.length / 2) + fontSize * i;
            ctx.fillText(char, x, attractPosition.y);
        }
		
    }
}

// 监听鼠标移动事件，用于激活或禁用吸附模式
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 检测鼠标是否在中心区域
    if (x > attractPosition.x - fontSize * password.length / 2 && x < attractPosition.x + fontSize * password.length / 2 &&
        y > attractPosition.y - fontSize * 2 && y < attractPosition.y + fontSize) {
        attractMode = true;
    } else {
        attractMode = false;
        // 鼠标移出中心区域时重置 "password" 文本的下落位置和字符
        passwordDrops = passwordDrops.map((_, index) => ({
            y: 1,
            char: characters[Math.floor(Math.random() * characters.length)]
        }));
    }
});

// 设置定时器循环调用主绘制函数，以创建连续动画效果
setInterval(draw, 33);

// 监听鼠标点击事件，用于实现点击 "password" 文本时的页面跳转
// 监听鼠标点击事件，用于实现点击 "password" 文本时的页面跳转
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 计算 "password" 文本的位置范围
    const passwordStartX = attractPosition.x - (fontSize * password.length / 2);
    const passwordEndX = attractPosition.x + (fontSize * password.length / 2);
    const passwordY = attractPosition.y;

    // 检查点击是否在 "password" 文本范围内
    if (x >= passwordStartX && x <= passwordEndX && y >= passwordY && y <= passwordY + fontSize) {
        // 点击位置在 "password" 文本内，进行页面跳转
        window.location.href = '../../index.html'; // 替换 'your-target-page.html' 为您的目标页面 URL
    }
});


// 在3秒后激活移动端特效
setTimeout(() => {
    if (isMobileDevice()) {
        mobileModeActivated = true;
        mobilePasswordEffectStarted = true; // 开始移动端特效
        mobilePasswordLastUpdateTime = Date.now(); // 初始化更新时间
    }
}, mobilePasswordStartTime);


/*
// 获取 canvas 元素并设置绘图上下文
const canvas = document.getElementById('digitalRain');
const ctx = canvas.getContext('2d');

// 设置 canvas 尺寸为浏览器窗口尺寸
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 定义用于生成数字雨的字符集
const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const fontSize = 16; // 字符的大小
const columns = canvas.width / fontSize; // 根据画布宽度和字符大小计算列数

// 初始化一个数组来存储每一列字符的当前位置
const drops = Array.from({ length: columns }).fill(1);

// 用于 "password" 效果的变量
let attractMode = false; // 是否激活吸附模式
const attractPosition = { x: canvas.width / 2, y: canvas.height / 2 }; // 吸附中心点，设置为画布中心
const password = 'password'; // 吸附显示的文本
const passwordColumns = []; // 存储形成 "password" 的列索引
let passwordDrops = []; // 存储 "password" 文本的下落位置和当前字符

// 移动端特效变量
let mobileModeActivated = false;
let mobilePasswordEffectStarted = false;
const mobilePasswordStartTime = 10000; // 10秒后开始
let mobilePasswordCharIndex = 0; // 当前显示的 "password" 字符索引
const mobilePasswordSpeed = 20; // 数字雨的下落速度，比正常慢

// 检查是否为移动设备
function isMobileDevice() {
    return /Mobi|Android/i.test(navigator.userAgent);
}

// 预先计算形成 "password" 文本的列索引并初始化下落位置
for (let i = 0; i < password.length; i++) {
    const columnIndex = Math.floor(attractPosition.x / fontSize) - Math.floor(password.length / 2) + i;
    passwordColumns.push(columnIndex);
    // 初始化 "password" 每个字符的下落位置和当前显示的字符
    passwordDrops.push({ y: 1, char: characters[Math.floor(Math.random() * characters.length)] });
}

// 主绘制函数，负责绘制数字雨和 "password" 效果
function draw() {
    // 使用半透明背景覆盖画布，创建尾迹效果
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 设置文本样式
    ctx.fillStyle = '#0F0'; // 文本颜色设置为绿色
    ctx.font = `${fontSize}px monospace`; // 设置字体

    // 遍历每列，绘制字符
    drops.forEach((drop, i) => {
        // 当鼠标靠近中心时，特定列下落 "password" 文本的字符
        if (attractMode && passwordColumns.includes(i)) {
            const index = passwordColumns.indexOf(i);
            const { y, char } = passwordDrops[index];
            // 下落到指定位置前显示随机字符，到达后显示最终字符
            const finalChar = y * fontSize >= attractPosition.y ? password[index] : char;
            ctx.fillText(finalChar, i * fontSize, y * fontSize);

            // 更新下一个字符或保持当前字符，直到到达指定位置
            if (y * fontSize < attractPosition.y) {
                passwordDrops[index] = {
                    y: y + 1,
                    char: characters[Math.floor(Math.random() * characters.length)]
                };
            }
        } else {
            // 正常绘制数字雨
            const text = characters.charAt(Math.floor(Math.random() * characters.length));
            ctx.fillText(text, i * fontSize, drop * fontSize);

            // 当字符超出画布底部时，重置其位置
            if (drop * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    });

    // 如果移动端特效被激活，绘制移动端特效
    if (mobileModeActivated && mobilePasswordEffectStarted) {
        drawMobilePasswordEffect();
    }
}

// 绘制移动端特效的函数
function drawMobilePasswordEffect() {
    // 逐步显示 "password" 字符
    if (mobilePasswordCharIndex < password.length) {
        const char = password[mobilePasswordCharIndex];
        const x = attractPosition.x - (fontSize * password.length / 2) + fontSize * mobilePasswordCharIndex;
        const y = attractPosition.y;

        ctx.fillText(char, x, y);

        mobilePasswordCharIndex++; // 移动到下一个字符
    }
}

// 监听鼠标移动事件，用于激活或禁用吸附模式
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 检测鼠标是否在中心区域
    if (x > attractPosition.x - fontSize * password.length / 2 && x < attractPosition.x + fontSize * password.length / 2 &&
        y > attractPosition.y - fontSize * 2 && y < attractPosition.y + fontSize) {
        attractMode = true;
    } else {
        attractMode = false;
        // 鼠标移出中心区域时重置 "password" 文本的下落位置和字符
        passwordDrops = passwordDrops.map((_, index) => ({
            y: 1,
            char: characters[Math.floor(Math.random() * characters.length)]
        }));
    }
});

// 设置定时器循环调用主绘制函数，以创建连续动画效果
setInterval(draw, 33);

// 监听鼠标点击事件，用于实现点击 "password" 文本时的页面跳转
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 计算 "password" 文本的位置范围
    const passwordStartX = attractPosition.x - (fontSize * password.length / 2);
    const passwordEndX = attractPosition.x + (fontSize * password.length / 2);
    const passwordY = attractPosition.y;

    // 检查点击是否在 "password" 文本范围内
    if (x >= passwordStartX && x <= passwordEndX && y >= passwordY && y <= passwordY + fontSize) {
        // 点击位置在 "password" 文本内，进行页面跳转
        window.location.href = 'your-target-page.html'; // 替换 'your-target-page.html' 为您的目标页面 URL
    }
});

// 在10秒后激活移动端特效
setTimeout(() => {
    if (isMobileDevice()) {
        mobileModeActivated = true;
        mobilePasswordEffectStarted = true; // 开始移动端特效
    }
}, mobilePasswordStartTime);
*/






/*
// 获取 canvas 元素并设置绘图上下文
const canvas = document.getElementById('digitalRain');
const ctx = canvas.getContext('2d');

// 设置 canvas 尺寸为浏览器窗口尺寸
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 定义用于生成数字雨的字符集
const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const fontSize = 16; // 字符的大小
const columns = canvas.width / fontSize; // 根据画布宽度和字符大小计算列数

// 初始化一个数组来存储每一列字符的当前位置
const drops = Array.from({ length: columns }).fill(1);

// 用于 "password" 效果的变量
let attractMode = false; // 是否激活吸附模式
const attractPosition = { x: canvas.width / 2, y: canvas.height / 2 }; // 吸附中心点，设置为画布中心
const password = 'password'; // 吸附显示的文本
const passwordColumns = []; // 存储形成 "password" 的列索引
let passwordDrops = []; // 存储 "password" 文本的下落位置和当前字符

// 预先计算形成 "password" 文本的列索引并初始化下落位置
for (let i = 0; i < password.length; i++) {
    const columnIndex = Math.floor(attractPosition.x / fontSize) - Math.floor(password.length / 2) + i;
    passwordColumns.push(columnIndex);
    // 初始化 "password" 每个字符的下落位置和当前显示的字符
    passwordDrops.push({ y: 1, char: characters[Math.floor(Math.random() * characters.length)] });
}

// 主绘制函数，负责绘制数字雨和 "password" 效果
function draw() {
    // 使用半透明背景覆盖画布，创建尾迹效果
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 设置文本样式
    ctx.fillStyle = '#0F0'; // 文本颜色设置为绿色
    ctx.font = `${fontSize}px monospace`; // 设置字体

    // 遍历每列，绘制字符
    drops.forEach((drop, i) => {
        // 当鼠标靠近中心时，特定列下落 "password" 文本的字符
        if (attractMode && passwordColumns.includes(i)) {
            const index = passwordColumns.indexOf(i);
            const { y, char } = passwordDrops[index];
            // 下落到指定位置前显示随机字符，到达后显示最终字符
            const finalChar = y * fontSize >= attractPosition.y ? password[index] : char;
            ctx.fillText(finalChar, i * fontSize, y * fontSize);

            // 更新下一个字符或保持当前字符，直到到达指定位置
            if (y * fontSize < attractPosition.y) {
                passwordDrops[index] = {
                    y: y + 1,
                    char: characters[Math.floor(Math.random() * characters.length)]
                };
            }
        } else {
            // 正常绘制数字雨
            const text = characters.charAt(Math.floor(Math.random() * characters.length));
            ctx.fillText(text, i * fontSize, drop * fontSize);

            // 当字符超出画布底部时，重置其位置
            if (drop * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    });
}

// 监听鼠标移动事件，用于激活或禁用吸附模式
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 检测鼠标是否在中心区域
    if (x > attractPosition.x - fontSize * password.length / 2 && x < attractPosition.x + fontSize * password.length / 2 &&
        y > attractPosition.y - fontSize * 2 && y < attractPosition.y + fontSize) {
        attractMode = true;
    } else {
        attractMode = false;
        // 鼠标移出中心区域时重置 "password" 文本的下落位置和字符
        passwordDrops = passwordDrops.map((_, index) => ({
            y: 1,
            char: characters[Math.floor(Math.random() * characters.length)]
        }));
    }
});

// 设置定时器循环调用主绘制函数，以创建连续动画效果
setInterval(draw, 33);

// 监听鼠标点击事件，用于实现点击 "password" 文本时的页面跳转
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 计算 "password" 文本的位置范围
    const passwordStartX = attractPosition.x - (fontSize * password.length / 2);
    const passwordEndX = attractPosition.x + (fontSize * password.length / 2);
    const passwordY = attractPosition.y;

    // 检查点击是否在 "password" 文本范围内
    if (x >= passwordStartX && x <= passwordEndX && y >= passwordY && y <= passwordY + fontSize) {
        // 点击位置在 "password" 文本内，进行页面跳转
        window.location.href = 'indexindex.html'; // 替换 'your-target-page.html' 为您的目标页面 URL
    }
});
*/







/*
// 获取 canvas 元素并设置绘图上下文
const canvas = document.getElementById('digitalRain');
const ctx = canvas.getContext('2d');

// 设置 canvas 尺寸为浏览器窗口尺寸
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 定义用于生成数字雨的字符集
const characters = '01';
const fontSize = 16; // 字符的大小
const columns = canvas.width / fontSize; // 根据画布宽度和字符大小计算列数

// 初始化一个数组来存储每一列字符的当前位置
const drops = Array.from({ length: columns }).fill(1);

// 用于 "password" 效果的变量
let attractMode = false; // 是否激活吸附模式
const attractPosition = { x: canvas.width / 2, y: canvas.height / 2 }; // 吸附中心点，设置为画布中心
const password = 'password'; // 吸附显示的文本
const passwordColumns = []; // 存储形成 "password" 的列索引
let passwordDrops = []; // 存储 "password" 文本的下落位置

// 预先计算形成 "password" 文本的列索引并初始化下落位置
for (let i = 0; i < password.length; i++) {
    const columnIndex = Math.floor(attractPosition.x / fontSize) - Math.floor(password.length / 2) + i;
    passwordColumns.push(columnIndex);
    passwordDrops.push(0); // 初始化 "password" 每个字符的下落位置
}

// 主绘制函数，负责绘制数字雨和 "password" 效果
function draw() {
    // 使用半透明背景覆盖画布，创建尾迹效果
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 设置文本样式
    ctx.fillStyle = '#0F0'; // 文本颜色设置为绿色
    ctx.font = `${fontSize}px monospace`; // 设置字体

    // 遍历每列，绘制字符
    drops.forEach((drop, i) => {
        // 当鼠标靠近中心时，特定列下落 "password" 文本的字符
        if (attractMode && passwordColumns.includes(i)) {
            const index = passwordColumns.indexOf(i);
            ctx.fillText(password[index], i * fontSize, passwordDrops[index] * fontSize);

            // "password" 文本字符到达指定位置后停止
            if (passwordDrops[index] * fontSize < attractPosition.y) {
                passwordDrops[index]++;
            }
        } else {
            // 正常绘制数字雨
            const text = characters.charAt(Math.floor(Math.random() * characters.length));
            ctx.fillText(text, i * fontSize, drop * fontSize);

            // 当字符超出画布底部时，重置其位置
            if (drop * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    });
}

// 监听鼠标移动事件，用于激活或禁用吸附模式
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 检测鼠标是否在中心区域
    if (x > attractPosition.x - fontSize * password.length / 2 && x < attractPosition.x + fontSize * password.length / 2 &&
        y > attractPosition.y - fontSize && y < attractPosition.y + fontSize) {
        attractMode = true;
    } else {
        attractMode = false;
        // 鼠标移出中心区域时重置 "password" 文本的下落位置
        passwordDrops = passwordDrops.map(() => 0);
    }
});

// 监听鼠标点击事件，实现页面跳转
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 检测点击是否发生在 "password" 文本上
    if (x > attractPosition.x - fontSize * password.length / 2 && x < attractPosition.x + fontSize * password.length / 2 &&
        y > attractPosition.y - fontSize && y < attractPosition.y + fontSize) {
        window.location.href = 'next-page.html'; // 点击后跳转的目标URL
    }
});

// 设置定时器循环调用主绘制函数，以创建连续动画效果
setInterval(draw, 33);
*/






/*
// 获取 canvas 元素并设置绘图上下文
const canvas = document.getElementById('digitalRain');
const ctx = canvas.getContext('2d');

// 设置 canvas 尺寸为浏览器窗口尺寸
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 定义用于生成数字雨的字符集
const characters = '01';
const fontSize = 16; // 字符的大小
const columns = canvas.width / fontSize; // 根据画布宽度和字符大小计算列数

// 初始化一个数组来存储每一列字符的当前位置
const drops = Array.from({ length: columns }).fill(1);

// 用于 "password" 效果的变量
let attractMode = false; // 是否激活吸附模式
const attractPosition = { x: canvas.width / 2, y: canvas.height / 2 }; // 吸附中心点，设置为画布中心
let password = 'password'; // 吸附显示的文本
const passwordColumns = []; // 存储形成 "password" 的列索引

// 预先计算形成 "password" 文本的列索引
for (let i = 0; i < password.length; i++) {
    const columnIndex = Math.floor(attractPosition.x / fontSize) - Math.floor(password.length / 2) + i;
    passwordColumns.push(columnIndex);
}

// 主绘制函数，负责绘制数字雨和 "password" 效果
function draw() {
    // 使用半透明背景覆盖画布，创建尾迹效果
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 设置文本样式
    ctx.fillStyle = '#0F0'; // 文本颜色设置为绿色
    ctx.font = `${fontSize}px monospace`; // 设置字体

    // 遍历每列，绘制字符
    drops.forEach((drop, i) => {
        // 在吸附模式激活时，特定列显示 "password" 中的字符
        if (attractMode && passwordColumns.includes(i)) {
            const index = passwordColumns.indexOf(i);
            ctx.fillText(password[index], i * fontSize, attractPosition.y);
        } else {
            const text = characters.charAt(Math.floor(Math.random() * characters.length));
            ctx.fillText(text, i * fontSize, drop * fontSize);

            // 当字符超出画布底部或处于吸附模式的特定列时，重置其位置
            if (drop * fontSize > canvas.height && Math.random() > 0.975 || (attractMode && passwordColumns.includes(i))) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    });
}

// 监听鼠标移动事件，用于激活或禁用吸附模式
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 缩小激活吸附模式的鼠标范围，使 "password" 不容易被发现
    if (x > attractPosition.x - fontSize * password.length / 2 && x < attractPosition.x + fontSize * password.length / 2 &&
        y > attractPosition.y - fontSize && y < attractPosition.y + fontSize) {
        attractMode = true;
    } else {
        attractMode = false;
    }
});

// 监听鼠标点击事件，实现页面跳转
canvas.addEventListener('click', () => {
    if (attractMode) {
        window.location.href = 'next-page.html'; // 点击后跳转的目标URL
    }
});

// 设置定时器循环调用主绘制函数，以创建连续动画效果
setInterval(draw, 33);
*/






/*
// 获取canvas元素并设置上下文，用于后续的绘制操作
const canvas = document.getElementById('digitalRain');
const ctx = canvas.getContext('2d');

// 设置canvas的尺寸为浏览器窗口的尺寸
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 定义用于生成数字雨的字符集，这里使用了一组日文字符
const characters = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
const fontSize = 16; // 字体大小
const columns = canvas.width / fontSize; // 根据画布宽度和字体大小计算列数

// 初始化一个数组来存储每一列字符的当前位置
const drops = Array.from({ length: columns }).fill(1);

// 用于控制 "password" 吸附效果的变量
let attractMode = false; // 是否激活吸附模式
const attractPosition = { x: canvas.width / 2, y: canvas.height / 2 }; // 吸附中心点，设置为画布中心
let password = 'password'; // 吸附显示的文本
let pulse = 1; // 控制文本跳动的缩放因子
let pulseDirection = 0.05; // 控制缩放速度和方向，调整为更小的值以平滑动画

// 主绘制函数，负责绘制数字雨和吸附效果
function draw() {
    // 使用半透明的背景覆盖画布，创建尾迹效果
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 设置文本样式
    ctx.fillStyle = '#0F0'; // 文本颜色设置为绿色
    ctx.font = `${fontSize}px monospace`; // 设置字体

    // 遍历每列，绘制字符
    drops.forEach((drop, i) => {
        // 在吸附模式激活时，仅绘制偶数列，保持动态效果
        if (!attractMode || i % 2 === 0) {
            const text = characters.charAt(Math.floor(Math.random() * characters.length));
            ctx.fillText(text, i * fontSize, drop * fontSize);

            // 当字符超出画布底部时，重置其位置
            if (drop * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    });

    // 如果吸附模式激活，绘制吸附效果
    if (attractMode) {
        drawAttract();
    }
}

// 绘制吸附效果的函数
function drawAttract() {
    pulse += pulseDirection;
    // 当文本缩放因子超出范围时，反转缩放方向
    if (pulse > 1.5 || pulse < 0.8) {
        pulseDirection *= -1;
    }

    // 设置文本样式并居中绘制 "password"
    ctx.font = `bold ${fontSize * pulse}px monospace`;
    ctx.fillText(password, attractPosition.x - ctx.measureText(password).width / 2, attractPosition.y);

    // 当吸附模式激活时，将鼠标指针改为手形
    canvas.style.cursor = 'pointer';
}

// 监听鼠标移动事件，用于激活或禁用吸附模式
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 缩小激活吸附模式的鼠标范围，使 "password" 不容易被发现
    if (x > attractPosition.x - 5 && x < attractPosition.x + 5 &&
        y > attractPosition.y - 5 && y < attractPosition.y + 5) {
        attractMode = true;
    } else {
        attractMode = false;
        canvas.style.cursor = 'default';
    }
});

// 监听鼠标点击事件，实现页面跳转
canvas.addEventListener('click', () => {
    if (attractMode) {
        window.location.href = 'index.html'; // 点击后跳转的目标URL
    }
});

// 设置定时器循环调用主绘制函数，以创建连续动画效果
setInterval(draw, 33);

*/