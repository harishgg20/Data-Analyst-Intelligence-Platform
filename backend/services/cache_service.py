import os
import json
import asyncio
import time
from functools import wraps
from typing import Optional, Any, Callable
import traceback

# Try importing redis
try:
    import redis.asyncio as redis
    from redis.exceptions import ConnectionError, TimeoutError
    REDIS_AVAILABLE = True
except ImportError:
    msg = "Redis package not installed. Using in-memory cache."
    print(msg)
    REDIS_AVAILABLE = False

class CacheService:
    def __init__(self):
        self.redis_client = None
        self.memory_cache = {} # { key: { 'value': val, 'expires': timestamp } }
        self.use_redis = False
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

        if REDIS_AVAILABLE:
            # Attempt lazy connection
            try:
                self.redis_client = redis.from_url(
                    self.redis_url, 
                    decode_responses=True, 
                    socket_connect_timeout=2
                )
                self.use_redis = True
            except Exception as e:
                print(f"Warning: Redis init failed ({e}). Defaulting to memory.")
                self.use_redis = False

    async def _check_redis_connection(self):
        """Simple ping to verify redis is actually alive"""
        if not self.use_redis or not self.redis_client:
            return False
        try:
            await self.redis_client.ping()
            return True
        except Exception:
            # If ping fails, disable redis temporarily or permanently for this instance
            # For simplicity, we fallback to memory for this request
            return False

    async def get(self, key: str) -> Optional[Any]:
        # 1. Try Redis
        if self.use_redis:
            try:
                val = await self.redis_client.get(key)
                if val:
                    return json.loads(val)
            except Exception as e:
                # Log only once or sparsely in real app
                # print(f"Cache get error (Redis): {e}") 
                pass # Fall through to memory? No, Redis failure usually means cache miss or seamless fallback
                
        # 2. Try Memory (Fallback or Primary)
        # Note: If use_redis is True but failed, we might want to check memory
        # But usually we don't sync them. `memory_cache` is primarily for when Redis is OFF.
        
        if not self.use_redis:
            entry = self.memory_cache.get(key)
            if not entry:
                return None
            if entry['expires'] < time.time():
                del self.memory_cache[key]
                return None
            return entry['value']
            
        return None

    async def set(self, key: str, value: Any, ttl: int = 60):
        json_val = json.dumps(value)
        
        # 1. Try Redis
        if self.use_redis:
            try:
                await self.redis_client.set(key, json_val, ex=ttl)
                return
            except Exception as e:
                print(f"Cache set error (Redis): {e}")
                # Fallback to memory so we at least cache locally
        
        # 2. Memory
        self.memory_cache[key] = {
            'value': value, # Store native object in memory
            'expires': time.time() + ttl
        }

    async def clear(self, key_pattern: str = None):
        if self.use_redis:
            try:
                # simplified clear
                await self.redis_client.flushdb()
            except:
                pass
        self.memory_cache = {}

# Singleton instance
cache_service = CacheService()

def cache(ttl: int = 60, key_prefix: str = ""):
    """
    Decorator for caching async FastAPI endpoint responses.
    Generates key based on function name + kwargs.
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 1. Generate Key
            # Filter out 'db' session or large objects from key generation if possible
            # Simple approach: JSON dump of kwargs (excluding private/complex objects)
            
            clean_kwargs = {k: v for k, v in kwargs.items() if k != 'db' and not k.startswith('_')}
            key_part = json.dumps(clean_kwargs, sort_keys=True)
            cache_key = f"{key_prefix}:{func.__name__}:{key_part}"
            
            # 2. Check Cache
            cached = await cache_service.get(cache_key)
            if cached is not None:
                # print(f"Cache HIT: {cache_key}")
                return cached
            
            # 3. Call Function
            # print(f"Cache MISS: {cache_key}")
            result = await func(*args, **kwargs)
            
            # 4. Set Cache
            if result is not None:
                await cache_service.set(cache_key, result, ttl)
                
            return result
        return wrapper
    return decorator
