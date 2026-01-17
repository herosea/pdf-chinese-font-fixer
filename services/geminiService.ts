
import { GoogleGenAI } from "@google/genai";
import { ImageQuality } from "../types";

// Utility to remove invisible characters that cause rendering artifacts
export const cleanHiddenChars = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\ufffc/g, '') // Object Replacement Character
    .replace(/\ufffd/g, '') // Replacement Character
    .replace(/\u200b/g, '') // Zero Width Space
    .replace(/\ufeff/g, '') // Byte Order Mark
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ''); // Control chars
};

// 1. 系统指令 (System Instruction) - 定义不可逾越的底线
const SYSTEM_INSTRUCTION = `
你现在是搭载“多模态视觉认知引擎”的高阶图像修复专家。
你的核心任务是执行“语义级图像重构”，特别专注于**简体中文文档**的修复。

## 绝对红线 (Critical Rules) - 违者导致任务失败
1.  **严禁翻译 (NO TRANSLATION)**：如果原图是中文，必须保持中文。**绝对禁止**将其翻译成英文或其他语言。
2.  **严禁篡改 (NO HALLUCINATION)**：必须忠实于原图的文字内容。不要增加不存在的段落，不要删除存在的文字（除非用户明确指示）。
3.  **视觉保真 (Visual Fidelity)**：保持原图的排版布局、字体风格（宋体/黑体等）和段落结构。

## 输出标准
*   分辨率：4K 超清。
*   文字：边缘锐利，无锯齿，印刷级清晰度。
*   背景：去除噪点和压缩伪影，保持干净。
`;

// 2. 智能修复模式 (当用户未提供文本时)
const INTELLIGENT_REPAIR_PROMPT = `
## 任务：智能视觉修复 (Intelligent Visual Repair)

**指令**：用户**未提供**参考文本。你必须完全依赖**原图**进行像素级重构。

**执行步骤**：
1.  **OCR 扫描**：像扫描仪一样，精准识别图中的每一个汉字、数字和标点。
2.  **原地重绘**：在识别出的字符原位置，用高清矢量笔触重新绘制该字符。
3.  **模糊推断**：如果遇到模糊不清的字，根据中文语境推断最可能的**简体中文字符**，**严禁**推断为形状相似的英文字母。

**再次强调**：
*   **不要翻译！** 
*   **不要改成英文！**
*   **所见即所得！**
`;

// 3. 严格覆盖模式 (当用户提供了文本时)
const STRICT_OVERRIDE_PROMPT_TEMPLATE = (userText: string) => `
## 任务：严格文本覆盖 (Strict Text Override)

**指令**：用户提供了本页面的**精确文本内容** (Ground Truth)。

**执行步骤**：
1.  **文本置入**：忽略原图识别出的文字，**只使用**下方的【用户指定文本】。
2.  **排版映射**：将【用户指定文本】按照原图的视觉段落分布，填入对应的位置。
3.  **冲突处理**：如果原图是“牛”，用户文本是“马”，**必须画成“马”**。
4.  **去伪存真**：原图中有但用户文本中没有的内容，**直接删除**（留白）。

[[ 用户指定文本 (Ground Truth) ]]：
${userText}
`;

const OCR_PROMPT = `
请识别并提取输入图像中所有的简体中文文本。
要求：
1. 保持换行和段落结构。
2. 仅输出内容，不要任何解释。
3. 自动修正明显的错别字。
`;

// Helper to determine closest supported aspect ratio for Gemini
const getClosestAspectRatio = (ratio: number): "1:1" | "3:4" | "4:3" | "9:16" | "16:9" => {
  const supported = [
    { id: "1:1", val: 1.0 },
    { id: "3:4", val: 0.75 },
    { id: "4:3", val: 1.33 },
    { id: "9:16", val: 0.5625 },
    { id: "16:9", val: 1.77 }
  ] as const;

  return supported.reduce((prev, curr) => 
    Math.abs(curr.val - ratio) < Math.abs(prev.val - ratio) ? curr : prev
  ).id;
};

// Sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const extractTextFromPage = async (base64Image: string, signal?: AbortSignal): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = base64Image.split(',')[1] || base64Image;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
        { text: OCR_PROMPT }
      ]
    }
  });

  const rawText = response.text || "";
  return cleanHiddenChars(rawText).trim();
};

export const enhancePageImage = async (
  base64Image: string, 
  quality: ImageQuality,
  aspectRatio: number,
  signal?: AbortSignal,
  customPrompt?: string
): Promise<string> => {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // 动态构建 User Prompt
  let userInstruction = "";
  
  if (customPrompt && customPrompt.trim().length > 0) {
    // 用户提供了文字：使用严格覆盖模式
    const cleanedCustomPrompt = cleanHiddenChars(customPrompt);
    userInstruction = STRICT_OVERRIDE_PROMPT_TEMPLATE(cleanedCustomPrompt);
  } else {
    // 用户未提供文字：使用智能修复模式
    userInstruction = INTELLIGENT_REPAIR_PROMPT;
  }

  const MAX_RETRIES = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (signal?.aborted) break;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = base64Image.split(',')[1] || base64Image;
      const targetAspectRatio = getClosestAspectRatio(aspectRatio);

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: userInstruction }
          ]
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION, // Move core rules here for stronger adherence
          imageConfig: {
            imageSize: quality,
            aspectRatio: targetAspectRatio
          }
        }
      });

      if (signal?.aborted) {
         throw new DOMException('Aborted', 'AbortError');
      }

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      
      throw new Error("No image data found in response");

    } catch (error: any) {
      lastError = error;
      
      const errorText = error.message || "";
      const isPermissionDenied = errorText.includes("PERMISSION_DENIED") || error.status === 403;
      const isNotFound = errorText.includes("Requested entity was not found") || error.status === 404;

      if (isPermissionDenied || isNotFound) {
        if (isPermissionDenied) error.isAuthError = true;
        if (isNotFound) error.isNotFound = true;
        throw error;
      }

      if (signal?.aborted || error.name === 'AbortError') {
        throw error;
      }

      console.warn(`Attempt ${attempt} failed:`, error);

      const isNetworkError = errorText.includes('JSON') || errorText.includes('fetch') || errorText.includes('network');
      const isServerOverload = error.status === 503 || error.status === 429;
      
      if (attempt < MAX_RETRIES && (isNetworkError || isServerOverload)) {
        const backoffTime = 2000 * Math.pow(2, attempt - 1);
        await sleep(backoffTime);
        continue;
      }
      
      break;
    }
  }

  throw lastError;
};
