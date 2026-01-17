import google.generativeai as genai
import base64
from typing import Optional

from app.config import get_settings

settings = get_settings()


# Initialize the Gemini client
genai.configure(api_key=settings.gemini_api_key)


# System instruction for image repair
SYSTEM_INSTRUCTION = """
你现在是搭载"多模态视觉认知引擎"的高阶图像修复专家。
你的核心任务是执行"语义级图像重构"，特别专注于**简体中文文档**的修复。

## 绝对红线 (Critical Rules) - 违者导致任务失败
1.  **严禁翻译 (NO TRANSLATION)**：**绝对禁止**将中文翻译成英文或其他语言。原图是什么语言，输出就是什么语言。
2.  **严禁遗漏 (NO OMISSION)**：必须保留原图中的所有文本元素，包括页眉、页脚、页码、图注和标点符号。
3.  **严禁篡改 (NO HALLUCINATION)**：不要增加原图中不存在的段落，也不要删除存在的文字（除非用户明确指示）。

## 视觉标准
*   **重构目标**：将模糊、有锯齿的位图文字重绘为边缘锐利的矢量级文字。
*   **字体保持**：尽可能匹配原图的字体风格（如宋体、黑体、楷体）。
*   **排版一致**：保持原图的换行位置、对齐方式和段落间距。
"""

INTELLIGENT_REPAIR_PROMPT = """
## 任务模式：高保真视觉重构 (High-Fidelity Visual Reconstruction)

**当前状态**：用户未提供参考文本。你必须作为"超级 OCR + 绘图引擎"，**所见即所得**地重绘原图。

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
"""


def get_aspect_ratio(ratio: float) -> str:
    """Get the closest supported aspect ratio for Gemini."""
    supported = [
        ("1:1", 1.0),
        ("3:4", 0.75),
        ("4:3", 1.33),
        ("9:16", 0.5625),
        ("16:9", 1.77),
    ]
    return min(supported, key=lambda x: abs(x[1] - ratio))[0]


async def enhance_page_image(
    base64_image: str,
    quality: str = "4K",
    aspect_ratio: float = 1.0,
    custom_prompt: Optional[str] = None
) -> str:
    """
    Enhance a page image using Gemini AI.
    
    Args:
        base64_image: Base64 encoded image data
        quality: Output quality (1K, 2K, 4K)
        aspect_ratio: Image aspect ratio
        custom_prompt: Optional custom prompt for specific instructions
        
    Returns:
        Base64 encoded enhanced image
    """
    # Build prompt
    if custom_prompt and custom_prompt.strip():
        prompt = f"""
## 任务模式：严格文本覆盖 (Strict Text Override)

**当前状态**：用户提供了本页面的**精确文本内容** (Ground Truth)。

**执行指令**：
1.  **内容置换**：忽略原图识别出的具体文字内容，**完全使用**下方的【用户指定文本】进行填充。
2.  **视觉映射**：将【用户指定文本】按照原图的视觉布局（位置、大小、颜色）填入对应区域。
3.  **冲突裁决**：如果原图显示是"A"，但用户文本说是"B"，**必须画成"B"**。
4.  **去伪存真**：原图中有但用户文本中没有的内容，请**直接删除**（留白处理）。

[[ 用户指定文本 (Ground Truth) ]]：
{custom_prompt}
"""
    else:
        prompt = INTELLIGENT_REPAIR_PROMPT
    
    # Prepare image data
    if ',' in base64_image:
        base64_data = base64_image.split(',')[1]
    else:
        base64_data = base64_image
    
    # Create the model
    model = genai.GenerativeModel(
        model_name='gemini-2.0-flash-exp',
        system_instruction=SYSTEM_INSTRUCTION,
    )
    
    # Generate response
    response = model.generate_content(
        [
            {
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": base64_data
                }
            },
            prompt
        ],
        generation_config={
            "response_modalities": ["image", "text"],
        }
    )
    
    # Extract image from response
    if response.candidates and response.candidates[0].content.parts:
        for part in response.candidates[0].content.parts:
            if hasattr(part, 'inline_data') and part.inline_data:
                return f"data:image/png;base64,{part.inline_data.data}"
    
    raise Exception("No image data in response")


async def extract_text_from_image(base64_image: str) -> str:
    """
    Extract text from an image using Gemini OCR.
    
    Args:
        base64_image: Base64 encoded image data
        
    Returns:
        Extracted text
    """
    ocr_prompt = """
请识别并提取输入图像中所有的简体中文文本。
要求：
1. 严格保持原始文本的换行、段落结构和阅读顺序。
2. 包含页眉、页脚和页码内容。
3. 仅输出提取的内容，不要包含任何解释性文字或 Markdown 标记。
4. 自动修正因模糊导致的明显错别字。
"""
    
    if ',' in base64_image:
        base64_data = base64_image.split(',')[1]
    else:
        base64_data = base64_image
    
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    response = model.generate_content([
        {
            "inline_data": {
                "mime_type": "image/jpeg",
                "data": base64_data
            }
        },
        ocr_prompt
    ])
    
    return response.text if response.text else ""
