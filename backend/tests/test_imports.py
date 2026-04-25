import os
import sys
import unittest
from pathlib import Path

# Mock environment variables for import-time safety
os.environ["SUPABASE_URL"] = "https://mock.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "mock-key"
os.environ["DATABASE_URL"] = "postgresql://user:pass@localhost:5432/db"
os.environ["OLLAMA_HOST"] = "http://localhost:11434"
os.environ["EMBED_MODEL"] = "all-minilm"

# Add backend to path so services can find "shared"
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

class TestServiceImports(unittest.TestCase):
    """Verifies all backend services are importable."""

    def _clear_main(self):
        if "main" in sys.modules:
            del sys.modules["main"]

    def test_api_gateway_import(self):
        self._clear_main()
        sys.path.insert(0, str(ROOT / "api_gateway"))
        from main import app
        self.assertIsNotNone(app)
        sys.path.pop(0)

    def test_ml_inference_import(self):
        self._clear_main()
        sys.path.insert(0, str(ROOT / "ml_inference"))
        from main import app
        self.assertIsNotNone(app)
        sys.path.pop(0)

    def test_llm_orchestrator_import(self):
        self._clear_main()
        sys.path.insert(0, str(ROOT / "llm_orchestrator"))
        from main import app
        self.assertIsNotNone(app)
        sys.path.pop(0)

    def test_rag_service_import(self):
        self._clear_main()
        sys.path.insert(0, str(ROOT / "rag_service"))
        from main import app
        self.assertIsNotNone(app)
        sys.path.pop(0)

    def test_embedding_worker_import(self):
        self._clear_main()
        sys.path.insert(0, str(ROOT / "embedding_worker"))
        from main import app
        self.assertIsNotNone(app)
        sys.path.pop(0)

if __name__ == "__main__":
    unittest.main()
