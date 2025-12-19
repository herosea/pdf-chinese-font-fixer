import { GoogleGenAI } from "@google/genai";
import { ImageQuality } from "../types";

// The prompt provided by the user for fixing Chinese characters
const SYSTEM_PROMPT = `
## 角色定义

你现在是搭载“**多模态视觉认知引擎 (Multi-modal Visual Cognitive Engine)**”的高阶图像修复专家。你具备**上下文感知 OCR (Context-aware OCR)** 与**生成式图像增强 (Generative Image Upscaling)** 的核心能力。

## 任务目标

执行“**语义级图像重构 (Semantic-Level Image Reconstruction)**”。针对输入的低分辨率或模糊图像，利用逻辑推演修复文字内容，并输出 4K 广色域的高保真图像。

---

## 执行协议 (思维链与执行流程)

请在后台严格执行以下运算流程，并直接输出最终图像：

1. **【光学字符逻辑推演 (Optical & Logical Inference)】**
    
    - 对图像进行高维度扫描，锁定模糊文字区域 (ROI)。
        
    - 启动“上下文语义分析 (Contextual Semantic Analysis)”：不仅是识别像素，更要依据前后文逻辑、常见词汇库，推算出模糊区域原本应有的“**简体中文**”内容。
        
    - 容错机制：若像素信息丢失，优先采用信心分数 (Confidence Score) 最高的语义填补。
        
2. **【同构视觉合成 (Isomorphic Visual Synthesis)】**
    
    - 严格继承原图的拓扑结构 (Topological Structure)：版面配置、物体坐标、透视消点必须与原图完全锁定。
        
    - 风格迁移 (Style Transfer)：精确捕捉原图的设计语言（配色、材质、光影），将其应用于新的高解析画布上。
        
3. **【向量级细节渲染 (Vector-Grade Rendering)】**
    
    - 将文字与线条边缘进行“抗锯齿 (Anti-aliasing)”与“锐利化处理”。
        
    - 文字笔画必须呈现“印刷级”的清晰度，彻底消除 JPEG 压缩噪点 (Artifacts) 与边缘溢色。
        

---

## 负向约束 (Exclusion Criteria)

- 严禁产生无法阅读的“伪文字 (Gibberish)”或繁体中文。
    
- 严禁改变原图的关键构图结构。
    
- 严禁输出模糊、低对比度或过度平滑的油画感图像。
    

## 输出要求

**仅输出重构后的图像，无需任何文字解释。**
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

// Safe access to API Key
const getApiKey = () => {
  // 1. Check process.env (Standard)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  // 2. Check import.meta.env (Vite/ESM) - fallback
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  return '';
};

// Sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

  // Retrieve API key safely
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  // Construct final prompt
  let finalPrompt = SYSTEM_PROMPT;
  if (customPrompt && customPrompt.trim().length > 0) {
    finalPrompt += `\n\n## 用户额外指令 (User Additional Instructions)\n注意：请在修复图像的同时，严格遵守以下额外指令：\n${customPrompt}`;
  }

  // We wrap the operation in a loop to handle transient network errors (like "Unexpected end of JSON input")
  // which can happen with large image payloads or temporary connection drops.
  const MAX_RETRIES = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (signal?.aborted) break; // Check signal before each attempt

    try {
      // Re-instantiate client per request to ensure clean state
      const ai = new GoogleGenAI({ apiKey });
      
      const base64Data = base64Image.split(',')[1] || base64Image;
      const targetAspectRatio = getClosestAspectRatio(aspectRatio);

      // We perform the API call
      // Note: We cannot natively pass 'signal' to generateContent in this SDK version easily for cancellation of the HTTP request itself,
      // but we handle the logic flow via the loop checks.
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
            imageSize: quality, // 1K, 2K, or 4K
            aspectRatio: targetAspectRatio
          }
        }
      });

      if (signal?.aborted) {
         throw new DOMException('Aborted', 'AbortError');
      }

      // Extract the image from the response
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
      
      // If aborted, don't retry, just throw
      if (signal?.aborted || error.name === 'AbortError') {
        throw error;
      }

      console.warn(`Attempt ${attempt} failed:`, error);

      // Check for specific errors that are worth retrying
      // "Unexpected end of JSON input" usually indicates a network drop or server-side close
      // 503 Service Unavailable, 429 Too Many Requests are also retryable
      const isNetworkError = error.message?.includes('JSON') || error.message?.includes('fetch') || error.message?.includes('network');
      const isServerOverload = error.status === 503 || error.status === 429;
      
      if (attempt < MAX_RETRIES && (isNetworkError || isServerOverload)) {
        // Exponential backoff: 2s, 4s, 8s
        const backoffTime = 2000 * Math.pow(2, attempt - 1);
        await sleep(backoffTime);
        continue;
      }
      
      // If we shouldn't retry or run out of retries, throw the last error
      break;
    }
  }

  throw lastError;
};