document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const baziForm = document.getElementById('baziForm');
    const resultSection = document.getElementById('result');
    const resultText = document.getElementById('result-text');
    const loading = document.getElementById('loading');
    const newAnalysisBtn = document.getElementById('new-analysis');
    
    // FAQ 交互
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.question');
        question.addEventListener('click', () => {
            // 关闭其他打开的FAQ项
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // 切换当前FAQ项的状态
            item.classList.toggle('active');
        });
    });
    
    // 表单提交处理
    baziForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // 获取表单数据
        const name = document.getElementById('name').value;
        const birthday = document.getElementById('birthday').value;
        const birthTime = document.getElementById('birthTime').value;
        const birthPlace = document.getElementById('birthPlace').value;
        
        // 获取性别信息 - 使用下拉框
        const gender = document.getElementById('gender').value;
        
        // 获取历法类型 - 使用下拉框
        const calendarType = document.getElementById('calendar-type').value;
        
        // 显示结果区域和加载动画
        resultSection.classList.remove('hidden');
        loading.style.display = 'flex';
        resultText.style.display = 'none';
        
        // 滚动到结果区域
        resultSection.scrollIntoView({ behavior: 'smooth' });
        
        // 构建发送到DeepSeek API的prompt
        const prompt = `你是个全球顶尖的命理大师，这是我的信息：【姓名：${name}、性别：${gender}、生日(${calendarType})：${birthday}、出生时分：${birthTime}、出生地点：${birthPlace}】，请根据我的八字，描述我的正缘画像，包括长相，身高，出生地，工作地，家庭条件，学历，性格，年纪等。直接一些，方便我去找。请使用markdown格式输出，并使用统一的标题和分段格式。`;
        
        // 调用DeepSeek API
        sendMessage(prompt);
    });
    
    // 加载缓存
    const savedCache = localStorage.getItem('responseCache');
    if (savedCache) {
        try {
            responseCache = JSON.parse(savedCache);
            console.log("已从本地存储加载缓存");
        } catch (e) {
            console.error("加载缓存失败:", e);
            responseCache = {};
        }
    }
    
    // 重新分析按钮事件
    newAnalysisBtn.addEventListener('click', function() {
        resultSection.classList.add('hidden');
        window.scrollTo({
            top: document.getElementById('analysis-form').offsetTop,
            behavior: 'smooth'
        });
    });
});

// 修改sendMessageToDeepSeek函数，确保正确调用API
async function sendMessageToDeepSeek(message) {
    try {
        console.log("正在发送API请求...");
        
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message
            })
        });

        console.log("API响应状态:", response.status);
        
        if (!response.ok) {
            if (response.status === 504) {
                throw new Error('请求超时，请稍后重试');
            }
            throw new Error(`API请求失败: ${response.status}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('调用API时出错:', error);
        return '抱歉，我无法处理您的请求。' + 
               (error.message.includes('timeout') ? '服务器响应时间过长，请稍后重试。' : error.message);
    }
}

// 添加缓存机制
let responseCache = {};

// 修改现有的发送消息函数，使用真实API
async function sendMessage(prompt) {
    // 获取DOM元素
    const loading = document.getElementById('loading');
    const resultText = document.getElementById('result-text');
    
    // 检查缓存中是否有结果
    const cacheKey = prompt.trim();
    if (responseCache[cacheKey]) {
        console.log("使用缓存的结果");
        // 显示加载动画一小段时间，然后显示缓存结果
        setTimeout(() => {
            loading.style.display = 'none';
            resultText.style.display = 'block';
            resultText.innerHTML = responseCache[cacheKey];
        }, 1000);
        return;
    }
    
    // 添加进度提示文本
    const loadingText = loading.querySelector('p');
    const originalText = loadingText.textContent;
    
    // 设置进度更新
    let dots = 0;
    const progressInterval = setInterval(() => {
        dots = (dots + 1) % 4;
        const dotString = '.'.repeat(dots);
        loadingText.textContent = `正在分析你的八字命理${dotString}`;
        
        // 每5秒更新一次提示信息
        if (dots === 0) {
            const messages = [
                "正在解析你的生辰八字...",
                "正在计算命理五行...",
                "正在分析你的正缘特征...",
                "正在生成详细画像...",
                "马上就好，请稍候..."
            ];
            loadingText.textContent = messages[Math.floor(Math.random() * messages.length)];
        }
    }, 500);
    
    // 调用DeepSeek API
    const response = await sendMessageToDeepSeek(prompt);
    
    // 将结果存入缓存
    const formattedResponse = formatResponse(response);
    responseCache[cacheKey] = formattedResponse;
    
    // 清除进度更新
    clearInterval(progressInterval);
    
    // 显示结果
    loading.style.display = 'none';
    resultText.style.display = 'block';
    resultText.innerHTML = formattedResponse;
}

// 格式化API响应
function formatResponse(response) {
    // 处理Markdown格式
    
    // 1. 处理标题
    response = response.replace(/#{1,6}\s+(.*?)(?:\n|$)/g, function(match, title) {
        const level = match.trim().indexOf(' ');
        return `<h${level}>${title.trim()}</h${level}>`;
    });
    
    // 2. 处理粗体
    response = response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 3. 处理斜体
    response = response.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 4. 处理列表
    response = response.replace(/^\s*[-*+]\s+(.*?)(?:\n|$)/gm, '<li>$1</li>');
    response = response.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
    
    // 5. 处理有序列表
    response = response.replace(/^\s*\d+\.\s+(.*?)(?:\n|$)/gm, '<li>$1</li>');
    response = response.replace(/(<li>.*?<\/li>)+/g, function(match) {
        if (match.indexOf('<ul>') === -1) {
            return '<ol>' + match + '</ol>';
        }
        return match;
    });
    
    // 6. 处理引用
    response = response.replace(/^\s*>\s+(.*?)(?:\n|$)/gm, '<blockquote>$1</blockquote>');
    
    // 7. 处理代码块
    response = response.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // 8. 处理行内代码
    response = response.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 9. 处理分隔线
    response = response.replace(/^\s*[-*_]{3,}\s*$/gm, '<hr>');
    
    // 10. 处理段落和换行
    response = response.replace(/\n\n/g, '</p><p>');
    response = response.replace(/\n/g, '<br>');
    
    // 确保所有内容都在段落标签内
    if (!response.startsWith('<h') && !response.startsWith('<ul') && 
        !response.startsWith('<ol') && !response.startsWith('<blockquote') && 
        !response.startsWith('<pre')) {
        response = '<p>' + response;
    }
    if (!response.endsWith('</p>') && !response.endsWith('</h1>') && 
        !response.endsWith('</h2>') && !response.endsWith('</h3>') && 
        !response.endsWith('</h4>') && !response.endsWith('</h5>') && 
        !response.endsWith('</h6>') && !response.endsWith('</ul>') && 
        !response.endsWith('</ol>') && !response.endsWith('</blockquote>') && 
        !response.endsWith('</pre>')) {
        response = response + '</p>';
    }
    
    // 保存缓存
    saveCache();
    
    return response;
}

// 保存缓存到localStorage
function saveCache() {
    try {
        localStorage.setItem('responseCache', JSON.stringify(responseCache));
    } catch (e) {
        console.error("保存缓存失败:", e);
    }
}
