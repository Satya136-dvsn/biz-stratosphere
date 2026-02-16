# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class MLExplainRequest(BaseModel):
    model_name: str
    features: Dict[str, Any]
    feature_names: Optional[List[str]] = None
    include_plots: bool = True
