import pandas as pd
import io
from typing import Dict, Any, List

# Import log_trace from router (or define local helper to avoid circular imports)
from datetime import datetime
def log_trace_service(msg):
    try:
        with open("debug_trace.txt", "a") as f:
            f.write(f"{datetime.now()} [SERVICE]: {msg}\n")
    except:
        pass

class DataProcessingService:
    async def analyze_dataset(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        log_trace_service(f"Service Start: {filename}")
        try:
            # Load data with robust encoding handling
            encodings = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252']
            df = None
            error_msgs = []
            
            for encoding in encodings:
                try:
                    log_trace_service(f"Trying encoding: {encoding}")
                    df = pd.read_csv(io.BytesIO(file_content), encoding=encoding)
                    log_trace_service(f"Success with {encoding}")
                    break
                except UnicodeDecodeError:
                    continue
                except Exception as e:
                    error_msgs.append(f"{encoding}: {str(e)}")
            
            if df is None:
                log_trace_service("All encodings failed")
                return {"error": f"Failed to read CSV. Tried encodings: {encodings}. Errors: {'; '.join(error_msgs)}"}
            
            # 1. Basic Stats
            log_trace_service("Calculating Stats")
            total_rows = len(df)
            total_cols = len(df.columns)
            
            # 2. Data Cleaning Analysis
            log_trace_service("Checking Cleanliness")
            missing_values = df.isnull().sum().to_dict()
            duplicates = df.duplicated().sum()
            
            # 3. Column Type Inference
            log_trace_service("Inferring Types")
            column_types = {col: str(dtype) for col, dtype in df.dtypes.items()}
            
            # 4. Preview Data
            log_trace_service("Generating Preview")
            preview = df.head(100).to_dict(orient='records')
            
            # 5. Generate Cleaning Recommendations
            recommendations = []
            if duplicates > 0:
                recommendations.append(f"Remove {duplicates} duplicate rows")
            
            for col, missing in missing_values.items():
                if missing > 0:
                    pct = (missing / total_rows) * 100
                    recommendations.append(f"Fill missing values in '{col}' ({pct:.1f}% missing)")
            
            import math
            # Sanitize for JSON (convert numpy types and handle NaN/NaT/Inf)
            def sanitize(obj):
                if isinstance(obj, list):
                    return [sanitize(v) for v in obj]
                if isinstance(obj, dict):
                    return {k: sanitize(v) for k, v in obj.items()}
                
                # Handle pandas/numpy nulls (NaN, NaT, pd.NA)
                if pd.isna(obj):
                    return None
                    
                # Handle numpy types (int64, float64, etc)
                if hasattr(obj, 'item'): 
                    val = obj.item()
                    # Check again after conversion (e.g. numpy nan -> float nan)
                    if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
                        return None
                    return val
                
                # Handle standard float nan/inf
                if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
                    return None
                    
                return obj
            
            log_trace_service("Sanitizing Output")
            result = {
                "filename": filename,
                "shape": {"rows": int(total_rows), "cols": int(total_cols)},
                "columns": list(df.columns),
                "types": column_types,
                "missing_values": sanitize(missing_values),
                "duplicates": int(duplicates),
                "preview": sanitize(preview),
                "recommendations": recommendations,
                "is_clean": bool(duplicates == 0 and sum(missing_values.values()) == 0)
            }
            log_trace_service("Service Complete")
            return result
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            log_trace_service(f"SERVICE CRASH: {str(e)}\n{traceback.format_exc()}")
            return {"error": f"Analysis Error: {str(e)}"}

data_processor = DataProcessingService()
