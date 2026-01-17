import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, status
from typing import Optional
import base64

from app.models.schemas import FileUploadResponse, ProcessRequest, ProcessStatusResponse
from app.services.gemini_service import enhance_page_image
from app.utils.security import get_current_user
from app.config import get_settings

router = APIRouter()
settings = get_settings()

# In-memory file store (replace with proper storage in production)
files_db: dict[str, dict] = {}


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a PDF or image file for processing.
    """
    # Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file.content_type} not supported. Allowed: {allowed_types}"
        )
    
    # Read file content
    content = await file.read()
    file_id = str(uuid.uuid4())
    
    # Store file info
    files_db[file_id] = {
        "id": file_id,
        "filename": file.filename,
        "content_type": file.content_type,
        "content": content,
        "user_id": current_user.get("sub"),
        "status": "uploaded",
        "pages": 1,  # Will be updated for PDFs
        "processed_pages": {},
    }
    
    return FileUploadResponse(
        file_id=file_id,
        filename=file.filename or "unknown",
        pages=1,
        status="uploaded"
    )


@router.post("/process")
async def process_file(
    request: ProcessRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Process uploaded file pages with AI enhancement.
    """
    if request.file_id not in files_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    file_info = files_db[request.file_id]
    
    # Verify ownership
    if file_info["user_id"] != current_user.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this file"
        )
    
    # TODO: Check credits/free pages
    
    # Update status
    file_info["status"] = "processing"
    
    # Process image (simplified - in production this would be a background task)
    content = file_info["content"]
    base64_image = base64.b64encode(content).decode()
    
    try:
        enhanced = await enhance_page_image(
            base64_image=base64_image,
            quality=request.quality,
            custom_prompt=request.custom_prompt
        )
        
        file_info["processed_pages"][0] = enhanced
        file_info["status"] = "completed"
        
        return {
            "status": "completed",
            "message": "Processing complete"
        }
        
    except Exception as e:
        file_info["status"] = "error"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Processing failed: {str(e)}"
        )


@router.get("/{file_id}/status", response_model=ProcessStatusResponse)
async def get_file_status(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get processing status for a file."""
    if file_id not in files_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    file_info = files_db[file_id]
    
    if file_info["user_id"] != current_user.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    return ProcessStatusResponse(
        file_id=file_id,
        status=file_info["status"],
        pages_processed=len(file_info["processed_pages"]),
        total_pages=file_info["pages"]
    )


@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    page: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Download processed file page."""
    if file_id not in files_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    file_info = files_db[file_id]
    
    if file_info["user_id"] != current_user.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    if page not in file_info["processed_pages"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not processed yet"
        )
    
    return {
        "page": page,
        "image": file_info["processed_pages"][page]
    }
