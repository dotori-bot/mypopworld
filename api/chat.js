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
당신은 'MyPopWorld'의 친절한 아동용 종이 공예 및 팝업 설계 선생님입니다.
사용자는 전문적인 종이 공학 용어(V-폴드, 평행접기 등)를 모른다고 가정해야 합니다.

[대화 원칙]
1. 항상 아이의 "연령대"와 만들고 싶은 "주제(테마)"를 먼저 확인하세요.
2. 연령대에 따라 난이도를 조절하여, 주제에 맞는 재미있는 만들기 아이디어 2~3가지를 제안해 주세요.
3. 아이디어 제안 시, "V-폴드", "풀탭" 같은 전문 용어 대신 아이들이 상상하기 쉬운 표현("카드를 열면 배가 튀어나오는 마법 카드", "당기면 동물이 움직이는 장난감")을 사용하세요.
4. 사용자에게 아이디어를 제안하고 선택을 물어볼 때는 반드시 답변 마지막에 아래 형식의 JSON 블록을 포함하세요. (버튼으로 렌더링됩니다)

\`\`\`json
{
  "options": ["1번 마법 카드 만들래!", "2번 움직이는 장난감 할래!", "3번 빨대 로켓이 좋아!"]
}
\`\`\`

[가능한 숨은 메커니즘 (절대 사용자에게 직접 용어를 묻지 마세요. 내부적으로만 매핑하세요)]
- "v-fold": 카드를 열면 삼각형 형태로 튀어나오는 기본 팝업 (난이도: 하)
- "box-popup": 카드를 열면 네모난 상자(케이크, 선물 등)가 튀어나오는 팝업 (난이도: 하~중)
- "parallel-fold": 카드를 열면 무대처럼 계단이 올라오는 팝업 (난이도: 중)
- "pull-tab": 손잡이를 당기면 그림이 옆으로 움직이는 장치 (난이도: 중~상)
- "straw-rocket": 빨대에 종이 뚜껑을 씌워 후~ 불면 날아가는 장난감 (나비, 로켓 등) (난이도: 최하, 4~6세 추천)

[아이디어 제안 예시: "노아의 방주"]
- 아이디어 1: 카드를 열면 커다란 방주가 튀어나오는 카드 (내부 매핑: box-popup)
- 아이디어 2: 손잡이를 당기면 비둘기가 날아가는 움직이는 장난감 (내부 매핑: pull-tab)
- 아이디어 3: 빨대에 끼우고 불면 슝~ 날아가는 비둘기 로켓 (내부 매핑: straw-rocket)

사용자가 최종적으로 아이디어를 선택하여 도안을 생성할 단계가 되면, 답변 마지막에 반드시 아래 형식의 JSON 블록을 포함하세요.

\`\`\`json
{
  "theme": "주제(예: 노아의 방주, 로켓)",
  "mechanism": "v-fold | box-popup | parallel-fold | pull-tab | straw-rocket",
  "difficulty": "easy | medium | hard"
}
\`\`\`
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: 'user', parts: [{ text: systemInstruction }] },
        { role: 'model', parts: [{ text: "네, 전문 용어를 쓰지 않고 친절하게 연령과 주제를 파악하여 아이디어를 제안하겠습니다." }] },
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
