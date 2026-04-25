import os
import httpx
import logging
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("api-gateway.chat")
router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

async def _proxy_supabase(request: Request, path: str):
    """Generic forwarder to Supabase PostgREST for chat data"""
    if not SUPABASE_URL:
        return JSONResponse({"error": "SUPABASE_URL not configured"}, status_code=500)
    
    # Supabase uses apikey and Authorization header for RLS
    auth_header = request.headers.get("Authorization", f"Bearer {SUPABASE_ANON_KEY}")
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": auth_header,
        "Content-Type": "application/json"
    }

    # Pass through prefer header if the client wants inserted representations back
    if "Prefer" in request.headers:
        headers["Prefer"] = request.headers["Prefer"]
        
    body = await request.body()
    
    # We strip any query parameters that the framework might automatically parse,
    # but httpx handles the params directly from the request.
    url = f"{SUPABASE_URL}/rest/v1{path}"
    
    # For parameterized DELETE paths we might already include params in 'path'
    query_params = dict(request.query_params)
    
    # Handle the fact that some URLs might already contain a query string 
    # e.g. path = /chat_conversations?id=eq.123
    base_path = path.split("?")[0]
    
    if "?" in path:
        extra_query = path.split("?")[1]
        for pair in extra_query.split("&"):
            if "=" in pair:
                k, v = pair.split("=", 1)
                query_params[k] = v
                
    url = f"{SUPABASE_URL}/rest/v1{base_path}"
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.request(
                method=request.method,
                url=url,
                content=body if body else None,
                params=query_params,
                headers=headers
            )
            # Send back whatever Supabase responded with
            return JSONResponse(
                content=resp.json() if resp.text else None,
                status_code=resp.status_code
            )
        except Exception as e:
            logger.error(f"Error proxying to Supabase DB: {e}")
            return JSONResponse({"error": str(e)}, status_code=502)

@router.api_route("/conversations", methods=["GET", "POST"])
async def proxy_conversations(request: Request):
    return await _proxy_supabase(request, "/chat_conversations")

@router.api_route("/conversations/{conv_id}", methods=["DELETE"])
async def delete_conversation(conv_id: str, request: Request):
    return await _proxy_supabase(request, f"/chat_conversations?id=eq.{conv_id}")

@router.api_route("/messages", methods=["GET", "POST"])
async def proxy_messages(request: Request):
    return await _proxy_supabase(request, "/chat_messages")

@router.api_route("/audits", methods=["POST"])
async def proxy_audits(request: Request):
    return await _proxy_supabase(request, "/ai_response_audits")
