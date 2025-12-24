from datetime import datetime
from typing import List, Dict, Any, Optional

def clean_date(date_str: str) -> Optional[datetime]:
    """
    Parses a date string into a datetime object.
    Supports ISO 8601 formats. Returns None if invalid.
    """
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        return None

def remove_nulls(data: List[Dict[str, Any]], required_fields: List[str]) -> List[Dict[str, Any]]:
    """
    Filters out records that have missing or None values in specified required fields.
    """
    cleaned_data = []
    for record in data:
        is_valid = True
        for field in required_fields:
            if record.get(field) is None:
                is_valid = False
                break
        if is_valid:
            cleaned_data.append(record)
    return cleaned_data

def normalize_text(text: str) -> str:
    """
    Trims whitespace and converts to lowercase.
    """
    if not text:
        return ""
    return text.strip().lower()
