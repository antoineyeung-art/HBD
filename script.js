document.addEventListener('DOMContentLoaded', () => {
    const flames = document.querySelectorAll('.flame');
    const wishMessage = document.getElementById('wish-message');
    const instruction = document.getElementById('instruction');
    const title = document.getElementById('title');
    const startBtn = document.getElementById('start-btn');
    const cakeClickArea = document.getElementById('cake-click-area');
    const bgm = document.getElementById('bgm'); // 获取音乐元素

    let isBlownOut = false;
    let audioContext;
    let analyser;
    let microphone;
    let javascriptNode;

    // --- 核心功能：熄灭蜡烛 ---
    function blowOutCandles() {
        if (isBlownOut) return;
        isBlownOut = true;

        // 1. 熄灭火焰
        flames.forEach(flame => {
            flame.classList.add('blown-out');
        });

        // 2. 播放音乐 🎵
        bgm.play().catch(error => {
            console.log("自动播放被阻止，可能是因为浏览器策略", error);
        });

        // 3. 发射彩带 🎉
        // 第一次喷射
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
        
        // 为了更热闹，延迟一点点再喷射两波
        setTimeout(() => {
            confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } });
            confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } });
        }, 250);

        // 4. 更新文字信息
        setTimeout(() => {
            title.innerText = "生日快乐 Leo！";
            instruction.innerText = "🩷❤️💛🩵💚🧡";
            wishMessage.classList.remove('hidden');
            wishMessage.classList.add('show-message');
            startBtn.style.display = 'none';
        }, 600);

        // 停止录音
        if (microphone) {
            microphone.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (javascriptNode) {
            javascriptNode.onaudioprocess = null;
        }
    }

    // --- 备用方案：点击熄灭 ---
    cakeClickArea.addEventListener('click', blowOutCandles);

    // --- 进阶方案：麦克风吹气检测 ---
    startBtn.addEventListener('click', () => {
        instruction.innerText = "正在监听...请对着麦克风用力吹气！";
        startBtn.innerText = "正在监听中...";
        startBtn.disabled = true;

        // 这里有个小技巧：用户点击按钮时，我们先把音乐“预加载”一下
        // 这样后面吹气触发播放时，成功率更高（绕过浏览器自动播放限制）
        bgm.load();

        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                microphone = audioContext.createMediaStreamSource(stream);
                javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

                analyser.smoothingTimeConstant = 0.8;
                analyser.fftSize = 1024;

                microphone.connect(analyser);
                analyser.connect(javascriptNode);
                javascriptNode.connect(audioContext.destination);

                javascriptNode.onaudioprocess = function() {
                    if (isBlownOut) return;

                    const array = new Uint8Array(analyser.frequencyBinCount);
                    analyser.getByteFrequencyData(array);

                    let values = 0;
                    const length = array.length;
                    for (let i = 0; i < length; i++) {
                        values += array[i];
                    }
                    const average = values / length;

                    // 阈值检测
                    if (average > 30) {
                        blowOutCandles();
                    }
                }
            })
            .catch(err => {
                console.error("无法获取麦克风权限:", err);
                instruction.innerText = "无法访问麦克风，请直接点击蛋糕来熄灭蜡烛吧！";
                startBtn.style.display = 'none';
            });
    });
});
