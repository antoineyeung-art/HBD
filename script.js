document.addEventListener('DOMContentLoaded', () => {
    const flames = document.querySelectorAll('.flame');
    const instruction = document.getElementById('instruction');
    const title = document.getElementById('title');
    const startBtn = document.getElementById('start-btn');
    const cakeClickArea = document.getElementById('cake-click-area');
    const videoContainer = document.getElementById('video-container');
    const birthdayVideo = document.getElementById('birthday-video');
    // 重新获取文字元素
    const wishMessage = document.getElementById('wish-message');

    let isBlownOut = false;
    let audioContext;
    let analyser;
    let microphone;
    let javascriptNode;

    function blowOutCandles() {
        if (isBlownOut) return;
        isBlownOut = true;

        // 1. 熄灭火焰
        flames.forEach(flame => {
            flame.classList.add('blown-out');
        });

        // 2. 发射彩带
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => {
            confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } });
            confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } });
        }, 250);

        title.innerText = "～臭宝起飞～";
        instruction.innerText = "❤️🧡💛💚🩵💙💜";
        startBtn.style.display = 'none'; 

        // 3. 蛋糕慢慢消失
        cakeClickArea.classList.add('fade-out');

        // 4. 等待1秒动画结束，显示视频 和 文字
        setTimeout(() => {
            cakeClickArea.style.display = 'none';
            
            // 显示视频
            videoContainer.classList.remove('hidden');
            videoContainer.classList.add('show-message');

            // 显示“愿望实现”文字
            wishMessage.classList.remove('hidden');
            wishMessage.classList.add('show-message');

            // 播放视频
            birthdayVideo.play().catch(error => {
                console.error("视频播放失败:", error);
                instruction.innerText = "请点击视频开始播放！"; 
            });

        }, 1000); 

        // 停止录音
        if (microphone) {
            microphone.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (javascriptNode) {
            javascriptNode.onaudioprocess = null;
        }
    }

    // --- 点击与麦克风逻辑保持不变 ---
    cakeClickArea.addEventListener('click', blowOutCandles);

    startBtn.addEventListener('click', () => {
        instruction.innerText = "正在监听...请对着麦克风用力吹气！";
        startBtn.innerText = "正在监听中...";
        startBtn.disabled = true;

        birthdayVideo.load();

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
                    for (let i = 0; i < length; i++) { values += array[i]; }
                    const average = values / length;

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
