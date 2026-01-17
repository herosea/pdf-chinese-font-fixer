
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
1.  **严禁翻译 (NO TRANSLATION)**：**绝对禁止**将中文翻译成英文或其他语言。原图是什么语言，输出就是什么语言。
2.  **严禁遗漏 (NO OMISSION)**：必须保留原图中的所有文本元素，包括页眉、页脚、页码、图注和标点符号。
3.  **严禁篡改 (NO HALLUCINATION)**：不要增加原图中不存在的段落，也不要删除存在的文字（除非用户明确指示）。

## 视觉标准
*   **重构目标**：将模糊、有锯齿的位图文字重绘为边缘锐利的矢量级文字。
*   **字体保持**：尽可能匹配原图的字体风格（如宋体、黑体、楷体）。
*   **排版一致**：保持原图的换行位置、对齐方式和段落间距。
`;

// 2. 智能修复模式 (当用户未提供文本时)
const INTELLIGENT_REPAIR_PROMPT = `
## 任务模式：高保真视觉重构 (High-Fidelity Visual Reconstruction)

**当前状态**：用户未提供参考文本。你必须作为“超级 OCR + 绘图引擎”，**所见即所得**地重绘原图。

**执行步骤 (Execution Protocol)**：
1.  **全画幅扫描**：从上到下、从左到右扫描图像，确保捕捉到每一个字符。
2.  **字符级重绘**：在识别出的字符原位置，用高清笔触重新绘制该字符。
3.  **中文优先纠错**：
    *   如果遇到模糊不清的字，**优先**根据中文语境推断最可能的**简体汉字**。
    *   **严禁**因为模糊就将其识别为形状相似的英文字母或乱码。
    *   **严禁**丢失页眉和页脚的微小文字。

**再次警告**：
*   **不要翻译！** (Do not translate Chinese to English)
*   **不要丢失文字！** (Do not miss any text block)
`;

// 3. 严格覆盖模式 (当用户提供了文本时)
const STRICT_OVERRIDE_PROMPT_TEMPLATE = (userText: string) => `
## 任务模式：严格文本覆盖 (Strict Text Override)

**当前状态**：用户提供了本页面的**精确文本内容** (Ground Truth)。

**执行指令**：
1.  **内容置换**：忽略原图识别出的具体文字内容，**完全使用**下方的【用户指定文本】进行填充。
2.  **视觉映射**：将【用户指定文本】按照原图的视觉布局（位置、大小、颜色）填入对应区域。
3.  **冲突裁决**：如果原图显示是"A"，但用户文本说是"B"，**必须画成"B"**。
4.  **去伪存真**：原图中有但用户文本中没有的内容，请**直接删除**（留白处理）。

[[ 用户指定文本 (Ground Truth) ]]：
${userText}
`;

const OCR_PROMPT = `
请识别并提取输入图像中所有的简体中文文本。
要求：
1. 严格保持原始文本的换行、段落结构和阅读顺序。
2. 包含页眉、页脚和页码内容。
3. 仅输出提取的内容，不要包含任何解释性文字或 Markdown 标记。
4. 自动修正因模糊导致的明显错别字。
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
          systemInstruction: SYSTEM_INSTRUCTION, // Core rules
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
