import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

// Tải biến môi trường từ file .env (ví dụ: GEMINI_API_KEY=YOUR_API_KEY)
dotenv.config();

// --- CẤU HÌNH API & SERVER ---
const PORT = 3000;
const API_KEY = process.env.GEMINI_API_KEY || ""; 
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
const MAX_RETRIES = 5;
//const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${gemini-2.5-flash}:generateContent?key=${AIzaSyDL6BUF0YrI2-3ZcJdaLfmp2qbJZeiqguA}`;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
// Kiểm tra API Key
if (!API_KEY) {
    console.error("Lỗi: GEMINI_API_KEY không được tìm thấy trong biến môi trường.");
    process.exit(1);
}

const app = express();
app.use(cors()); // Cho phép gọi API từ frontend (ví dụ: React app)
app.use(express.json()); // Cho phép Express đọc body JSON

/**
 * Hàm hỗ trợ ngủ (sleep) cho Exponential Backoff.
 * @param ms Thời gian ngủ bằng mili giây.
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Gọi API Gemini với cơ chế thử lại cấp số nhân (Exponential Backoff).
 * @param userPrompt Lời nhắc của người dùng.
 * @returns Nội dung văn bản kết quả hoặc null nếu thất bại.
 */
async function callGeminiApiWithRetry(userPrompt: string): Promise<{ text: string, error: string | null }> {
    const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: {
            parts: [{ text: "Bạn là một trợ lý sáng tạo và hữu ích. Hãy trả lời bằng tiếng Việt." }]
        },
        // Thêm công cụ tìm kiếm để tạo nội dung được căn cứ (grounded)
        tools: [{ "google_search": {} }],
    };

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                // Thử lại nếu là lỗi Rate Limit (429)
                if (response.status === 429 && i < MAX_RETRIES - 1) {
                    const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                    console.warn(`Thử lại lần ${i + 1} sau ${Math.round(delay)}ms do Rate Limit.`);
                    await sleep(delay);
                    continue;
                } else {
                    const errorData = await response.json();
                    throw new Error(`Lỗi API (${response.status}): ${errorData.error?.message || response.statusText}`);
                }
            }

            const result = await response.json();
            
            const candidate = result.candidates?.[0];
            if (candidate && candidate.content?.parts?.[0]?.text) {
                let text = candidate.content.parts[0].text;
                
                // Xử lý trích dẫn (citations)
                const groundingMetadata = candidate.groundingMetadata;
                if (groundingMetadata && groundingMetadata.groundingAttributions) {
                    const sources = groundingMetadata.groundingAttributions
                        .map((attribution: any) => ({
                            uri: attribution.web?.uri,
                            title: attribution.web?.title,
                        }))
                        .filter((source: { uri: string | undefined, title: string | undefined }) => source.uri && source.title);

                    if (sources.length > 0) {
                        text += '\n\n---\n**Nguồn tham khảo (Grounding Sources):**\n' + 
                              sources.slice(0, 3).map((s: any, index: number) => 
                                `${index + 1}. [${s.title}](${s.uri})`
                              ).join('\n');
                    }
                }

                return { text, error: null }; // Thành công
            } else {
                throw new Error("Phản hồi từ mô hình không có nội dung hợp lệ.");
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
            console.error(`Lỗi trong quá trình gọi API (Lần ${i + 1}):`, errorMessage);
            
            if (i === MAX_RETRIES - 1) {
                return { text: "", error: errorMessage }; // Thất bại sau tất cả các lần thử
            }
            
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await sleep(delay);
        }
    }
    return { text: "", error: "Đã xảy ra lỗi nghiêm trọng và hết số lần thử lại." };
}

// --- ROUTE HANDLER ---
app.post('/generate', async (req: Request, res: Response) => {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({ error: "Vui lòng cung cấp 'prompt' hợp lệ trong body request." });
    }

    // Gọi hàm xử lý API
    const result = await callGeminiApiWithRetry(prompt.trim());

    if (result.error) {
        return res.status(500).json({ 
            error: "Lỗi tạo nội dung từ Gemini.", 
            details: result.error 
        });
    }

    // Trả về kết quả thành công
    res.json({ content: result.text });
});

// --- KHỞI ĐỘNG SERVER ---
app.listen(PORT, () => {
    console.log(`Backend server đã chạy tại http://localhost:${PORT}`);
    console.log(`Endpoint: POST http://localhost:${PORT}/generate`);
    console.log("Sử dụng { \"prompt\": \"your query here\" } trong body request.");
});