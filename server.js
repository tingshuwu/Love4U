const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();  // 用于加载环境变量

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));  // 静态文件目录

// API代理端点
app.post('/api/analyze', async (req, res) => {
    try {
        const { message } = req.body;
        
        // 从环境变量获取API密钥
        const apiKey = process.env.DEEPSEEK_API_KEY;
        
        if (!apiKey) {
            throw new Error('API密钥未配置');
        }
        
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000,
                top_p: 0.95,
                frequency_penalty: 0.0
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`DeepSeek API错误: ${JSON.stringify(errorData)}`);
        }
        
        const data = await response.json();
        res.json({ response: data.choices[0].message.content });
    } catch (error) {
        console.error('API代理错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 处理所有其他请求，返回主页
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
}); 