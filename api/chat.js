import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // CORS setup for local dev / vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Get conversation history from request
    const { messages } = req.body;

    const systemInstruction = `
당신은 'MyPopWorld'의 팝업 카드 및 종이 공예 설계 AI 전문가입니다.
사용자와 대화하며 어떤 팝업 카드를 만들고 싶은지 파악하세요.
반드시 한국어로 친절하게 답변하세요.

사용할 수 있는 메커니즘 종류:
1. V-Fold (V자형 팝업) - 기본
2. Box Popup (박스/큐브 팝업) - 케이크, 선물상자 등에 적합
3. Parallel Fold (평행 접기) - 무대, 계단형 팝업
4. Pull Tab (풀탭) - 당기면 움직이는 장치
5. Straw Rocket (빨대 로켓) - 빨대에 꽂아 부는 뚜껑 장난감 (나비, 로켓 등)

충분히 구체화되었다고 판단되면(누구를 위한 것인지, 주제, 사용할 메커니즘 등), 답변 마지막에 반드시 아래 형식의 JSON 코드 블록을 포함하세요.
이 JSON은 도안 생성기에 의해 해석됩니다.

\`\`\`json
{
  "theme": "주제(예: 우주, 생일)",
  "mechanism": "v-fold | box-popup | parallel-fold | pull-tab | straw-rocket",
  "difficulty": "easy"
}
\`\`\`
    `;

    // Standard non-streaming generateContent for simplicity in serverless environment
    // Note: To support streaming in Vercel Serverless, Edge functions are preferred, 
    // but this MVP uses standard HTTP response.
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: 'user', parts: [{ text: systemInstruction }] },
        { role: 'model', parts: [{ text: "네, 시스템 지시사항을 이해했습니다. 사용자와 대화하며 팝업 카드를 기획하겠습니다." }] },
        ...messages.map(msg => ({
          role: msg.role === 'ai' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))
      ],
      config: {
        temperature: 0.7,
      }
    });

    return res.status(200).json({ 
      text: response.text 
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
}
