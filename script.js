document.addEventListener('DOMContentLoaded', () => {
    const flames = document.querySelectorAll('.flame');
    const instruction = document.getElementById('instruction');
    const title = document.getElementById('title');
    const startBtn = document.getElementById('start-btn');
    const cakeClickArea = document.getElementById('cake-click-area');
    // 获取新增的视频元素
    const videoContainer = document.getElementById('video-container');
    const birthdayVideo = document.getElementById('birthday-video');

    let isBlownOut = false;
    let audioContext;
    let analyser;
    let microphone;
    let javascriptNode;

    // --- 核心功能：熄灭蜡烛并播放视频 ---
    function blowOutCandles() {
        if (isBlownOut) return;
        isBlownOut = true;

        // 1. 熄灭火焰
        flames.forEach(flame => {
            flame.classList.add('blown-out');
        });

        // 2. 发射彩带 (气氛搞起来!)
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => {
            confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } });
            confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } });
        }, 250);

        // 更新标题和说明
        title.innerText = "愿望通通实现！";
        instruction.innerText = "❤️🧡💛💚🩵💙💜";
        startBtn.style.display = 'none'; // 立刻隐藏按钮

        // 3. 蛋糕慢慢消失
        // 给蛋糕容器加上 fade-out 类，触发 CSS 里的 1秒透明度过渡动画
        cakeClickArea.classList.add('fade-out');

        // 4. 等待1秒动画结束，然后隐藏蛋糕，显示并播放视频
        setTimeout(() => {
            // 彻底隐藏蛋糕占位
            cakeClickArea.style.display = 'none';
            
            // 显示视频容器
            videoContainer.classList.remove('hidden');
            videoContainer.classList.add('show-message'); // 复用之前的淡入动画

            // 播放视频 (带声音)
            // 因为用户之前有过点击交互，这里自动播放带声音通常是允许的
            birthdayVideo.play().catch(error => {
                console.error("视频播放失败，可能是浏览器限制:", error);
                instruction.innerText = "请点击视频开始播放！"; // 如果失败，提示用户手动点
            });

        }, 1000); // 这个 1000ms 要和 CSS 里的 transition: opacity 1s 保持一致

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

        // 在用户点击开始时，预加载一下视频，提高稍后自动播放的成功率
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
