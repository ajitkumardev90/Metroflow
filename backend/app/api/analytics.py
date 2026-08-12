from fastapi import APIRouter, Depends
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import List, Any
import json

from app.database.postgres import get_db
from app.schemas.analytics import AnalyticsSummaryResponse
from app.services.analytics_service import (
    get_analytics_summary,
    get_station_performance,
    get_route_performance,
    get_trends,
)
from app.middleware.auth import require_roles
from app.database.redis_db import cache_get, cache_set

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get(
    "/summary",
    response_model=AnalyticsSummaryResponse
)
def analytics_summary(
    current_user=Depends(require_roles(["admin", "manager", "user"])),
    db: Session = Depends(get_db)
):
    cache_key = "analytics:summary"
    cached_val = cache_get(cache_key)
    if cached_val:
        return json.loads(cached_val)

    result = get_analytics_summary(db)
    cache_set(cache_key, json.dumps(jsonable_encoder(result)), expire_seconds=60)
    return result


@router.get("/station-performance", response_model=List[Any])
def station_performance(
    current_user=Depends(require_roles(["admin", "manager"])),
    db: Session = Depends(get_db)
):
    """
    Get top stations by passenger flow.
    """
    cache_key = "analytics:station_performance"
    cached_val = cache_get(cache_key)
    if cached_val:
        return json.loads(cached_val)

    result = get_station_performance(db)
    cache_set(cache_key, json.dumps(jsonable_encoder(result)), expire_seconds=60)
    return result


@router.get("/route-performance", response_model=List[Any])
def route_performance(
    current_user=Depends(require_roles(["admin", "manager"])),
    db: Session = Depends(get_db)
):
    """
    Get passenger flow aggregated by route.
    """
    cache_key = "analytics:route_performance"
    cached_val = cache_get(cache_key)
    if cached_val:
        return json.loads(cached_val)

    result = get_route_performance(db)
    cache_set(cache_key, json.dumps(jsonable_encoder(result)), expire_seconds=60)
    return result


@router.get("/trends", response_model=List[Any])
def ridership_trends(
    current_user=Depends(require_roles(["admin", "manager", "user"])),
    db: Session = Depends(get_db)
):
    """
    Get ridership flow daily trends.
    """
    cache_key = "analytics:trends"
    cached_val = cache_get(cache_key)
    if cached_val:
        return json.loads(cached_val)

    result = get_trends(db)
    cache_set(cache_key, json.dumps(jsonable_encoder(result)), expire_seconds=60)
    return result