
import { GoogleGenAI } from "@google/genai";
import { ImageQuality } from "../types";

// Utility to remove invisible characters that cause rendering artifacts
export const cleanHiddenChars = (text: string): string => {
  if (!text) return '';
  return text
    // Remove Object Replacement Character (\ufffc) - common in PDF/Word copy-paste
    .replace(/\ufffc/g, '')
    // Remove Replacement Character (\ufffd)
    .replace(/\ufffd/g, '')
    // Remove Zero Width Space (\u200b)
    .replace(/\u200b/g, '')
    // Remove Byte Order Mark (\ufeff)
    .replace(/\ufeff/g, '')
    // Remove other obscure control characters (excluding normal whitespace 0x09, 0x0A, 0x0D)
    // Range: 0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
};

// The prompt provided by the user for fixing Chinese characters
const SYSTEM_PROMPT = `
## 角色定义

你现在是搭载“**多模态视觉认知引擎**”的高阶图像修复专家。你的核心任务是执行“**语义级图像重构**”，特别专注于**简体中文文档**的修复。

## 核心法则 (Prime Directives)

1.  **文本绝对优先权 (Text Supremacy)**：
    *   图像中的**视觉像素**仅作为**排版和风格**的参考。
    *   **用户提供的文本指令**或者是**上下文逻辑推演出的文本**是**内容**的唯一真理。
    *   **冲突解决**：当原图看起来像字符 A，但用户指令/上下文逻辑说是字符 B 时，**必须画成字符 B**。

2.  **高保真重构 (High-Fidelity Reconstruction)**：
    *   保留原图的版面布局、字体风格（宋体/黑体/手写体等）、字号大小、颜色和背景纹理。
    *   输出必须是 4K 分辨率，消除锯齿，边缘锐利，达到印刷级清晰度。

---

## 执行协议 (思维链)

1.  **锁定布局**：扫描原图，锁定每一行、每一个文本块的坐标位置。
2.  **内容注入与清洗**：
    *   读取用户的“目标文本内容”。
    *   **比对**：将目标文本与原图视觉内容比对。
    *   **删除判定**：如果原图中有某段文字，但用户的“目标文本内容”中没有，**视为用户有意删除**。请在生成图像时移除该部分内容（用背景色填充/留白）。
    *   **警告**：严禁通过“脑补”产生原图中不存在的额外文字。
3.  **风格渲染**：将目标文本内容，按照锁定的布局和原图的字体风格，重新绘制在画布上。
4.  **画质增强**：对文字边缘进行抗锯齿处理，去除噪点。

---

## 负向约束 (Exclusion Criteria)

- **严禁**保留原图中有、但用户提供的文本中没有的段落（必须删除）。
- **严禁**输出无法阅读的伪文字。
- **严禁**改变原图的段落结构和换行位置（除非该段落已被用户删除）。
- **严禁**保留原图中的模糊噪点或压缩伪影。
- **仅输出重构后的图像，无需任何文字解释。**
`;

const OCR_PROMPT = `
你是一个专业的 OCR 文字提取助手。
任务：请识别并提取输入图像中所有的简体中文文本。
要求：
1. 保持原始文本的换行和层级顺序。
2. 纠正明显的笔画断裂或因模糊导致的错误识别（基于词法逻辑）。
3. 仅输出提取出的文字内容，严禁输出任何解释性说明、Markdown 代码块标签或引言。
4. 严禁包含 \\ufffc (OBJ)、\\ufffd 或其他不可见控制字符。
5. 如果图中包含表格，请尝试保持表格的逻辑对应关系。
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

  // Find the one with minimal difference
  return supported.reduce((prev, curr) => 
    Math.abs(curr.val - ratio) < Math.abs(prev.val - ratio) ? curr : prev
  ).id;
};

// Sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const extractTextFromPage = async (base64Image: string, signal?: AbortSignal): Promise<string> => {
  // Always use process.env.API_KEY directly when initializing the GoogleGenAI client
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = base64Image.split(',')[1] || base64Image;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', // Use flash for faster OCR
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
        { text: OCR_PROMPT }
      ]
    }
  });

  const rawText = response.text || "";
  // Immediately clean any invisible artifacts from the model output
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

  let finalPrompt = SYSTEM_PROMPT;
  
  // 增强后的 Prompt 注入逻辑
  if (customPrompt && customPrompt.trim().length > 0) {
    // Ensure the prompt used for generation is also clean of artifacts
    const cleanedCustomPrompt = cleanHiddenChars(customPrompt);
    
    finalPrompt += `
    
    ================================================================================
    ⚠️ 【最高优先级修正指令 (CRITICAL OVERRIDE)】 ⚠️
    
    检测到用户提供了本页面的**精确文本内容 (Ground Truth)**。
    
    **执行要求：**
    1. **完全忽略**原图中与下方文本不一致的文字像素形状。
    2. **强制替换**：必须将画面中的文字内容严格替换为下方提供的文本。
    3. **删除与留白**：下方的文本是页面的**全集**。如果原图中有某些段落或乱码在下方文本中**不存在**，请**直接删除**该部分图像内容（留白处理），严禁保留。
    4. **一一对应**：请按照原图的排版位置，将下方文本填入对应的区域。
    
    [[ 用户指定的正确文本内容 ]]：
    ${cleanedCustomPrompt}
    ================================================================================
    `;
  }

  const MAX_RETRIES = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (signal?.aborted) break;

    try {
      // Re-instantiate Gemini right before call to ensure latest API key from process.env.API_KEY is used
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const base64Data = base64Image.split(',')[1] || base64Image;
      const targetAspectRatio = getClosestAspectRatio(aspectRatio);

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            },
            {
              text: finalPrompt
            }
          ]
        },
        config: {
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

      // DO NOT retry on authentication/permission errors
      if (isPermissionDenied || isNotFound) {
        // Categorize for UI
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
