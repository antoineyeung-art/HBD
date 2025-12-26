document.addEventListener('DOMContentLoaded', () => {
    const flames = document.querySelectorAll('.flame');
    const wishMessage = document.getElementById('wish-message');
    const instruction = document.getElementById('instruction');
    const title = document.getElementById('title');
    const startBtn = document.getElementById('start-btn');
    const cakeClickArea = document.getElementById('cake-click-area');

    let isBlownOut = false;
    let audioContext;
    let analyser;
    let microphone;
    let javascriptNode;

    // --- 核心功能：熄灭蜡烛 ---
    function blowOutCandles() {
        if (isBlownOut) return; // 防止重复触发
        isBlownOut = true;

        // 给所有火焰添加熄灭的CSS类
        flames.forEach(flame => {
            flame.classList.add('blown-out');
        });

        // 更新文字信息
        setTimeout(() => {
            title.innerText = "生日快乐！";
            instruction.innerText = "愿你年年有今日，岁岁有今朝！";
            wishMessage.classList.remove('hidden');
            wishMessage.classList.add('show-message');
            startBtn.style.display = 'none'; // 隐藏按钮
        }, 600); // 稍微延迟一点显示祝福语，等火焰熄灭动画完成

        // 停止录音（如果开启了）
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

        // 尝试获取麦克风权限
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
                    // 计算平均音量
                    for (let i = 0; i < length; i++) {
                        values += array[i];
                    }
                    const average = values / length;

                    console.log("当前音量:", average);

                    // 阈值设置：如果检测到音量大于 30 (这个值可以根据实际情况调整)，认为是在吹气
                    // 吹气的声音通常含有较多低频和高频杂音，平均音量会瞬间升高
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