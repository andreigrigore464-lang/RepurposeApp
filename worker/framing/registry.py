"""
Framing Strategy Registry
Declarative registry mapping framing mode strings to their respective implementation strategies.
Follows AGENTS.md Registry Architecture Rule: zero hardcoded framing branches in the engine.
System Layer: worker / framing / registry
"""

from typing import Dict, List
from framing.base import FramingStrategy
from framing.blurred_background import BlurredBackgroundFraming
from framing.center_crop import CenterCropFraming
from framing.smart_zoom import SmartZoomFraming
from framing.dynamic_tracking import DynamicTrackingFraming

# Declarative registry of available framing strategies
_FRAMING_REGISTRY: Dict[str, FramingStrategy] = {
    # Core identifiers
    "smart_zoom": SmartZoomFraming(),
    "dynamic_tracking": DynamicTrackingFraming(),
    "blurred_background": BlurredBackgroundFraming(),
    "center_crop": CenterCropFraming(),

    # Template Designer aliases
    "ai_face_focus": SmartZoomFraming(),
    "subject_tracking": DynamicTrackingFraming(),
    "ai_tracking": DynamicTrackingFraming(),
    "blurred_stack": BlurredBackgroundFraming(),
    "cover": CenterCropFraming(),
    "crop": CenterCropFraming(),
    "contain": BlurredBackgroundFraming(),
}

DEFAULT_FRAMING_MODE = "smart_zoom"

def get_framing_strategy(mode: str) -> FramingStrategy:
    """
    Retrieves the framing strategy by name.
    Falls back gracefully to DEFAULT_FRAMING_MODE if an unknown mode is provided.
    """
    clean_mode = str(mode or "").strip().lower()
    return _FRAMING_REGISTRY.get(clean_mode, _FRAMING_REGISTRY[DEFAULT_FRAMING_MODE])

def list_framing_strategies() -> List[str]:
    """Returns a list of all registered framing strategy identifiers."""
    return list(_FRAMING_REGISTRY.keys())

