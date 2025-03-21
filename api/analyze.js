const fetch = require('node-fetch');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '只允许 POST 请求' });
    }

    try {
        const { message } = req.body;
        
        // 从环境变量获取API密钥
        const apiKey = process.env.DEEPSEEK_API_KEY;
        
        if (!apiKey) {
            throw new Error('API密钥未配置');
        }

        // 设置请求超时
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, 30000); // 30秒超时

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
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`DeepSeek API错误: ${JSON.stringify(errorData)}`);
        }
        
        const data = await response.json();
        res.json({ response: data.choices[0].message.content });
    } catch (error) {
        console.error('API代理错误:', error);
        if (error.name === 'AbortError') {
            res.status(504).json({ error: '请求超时，请稍后重试' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
}; 