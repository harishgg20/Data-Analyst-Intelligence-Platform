from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
from .. import database, models, schemas

router = APIRouter(
    prefix="/api/products",
    tags=["Products"],
)

@router.get("/", response_model=List[schemas.ProductResponse])
async def get_products(db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Product))
    return result.scalars().all()

@router.post("/", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(product: schemas.ProductCreate, db: AsyncSession = Depends(database.get_db)):
    new_product = models.Product(**product.dict())
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    return new_product

@router.put("/{product_id}", response_model=schemas.ProductResponse)
async def update_product(product_id: int, product_update: schemas.ProductBase, db: AsyncSession = Depends(database.get_db)):
    # Check if exists
    result = await db.execute(select(models.Product).where(models.Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    for key, value in product_update.dict().items():
        setattr(product, key, value)
        
    await db.commit()
    await db.refresh(product)
    return product
    
@router.patch("/{product_id}/stock", response_model=schemas.ProductResponse)
async def update_stock(product_id: int, quantity: int, db: AsyncSession = Depends(database.get_db)):
    # Lightweight endpoint for just updating stock
    result = await db.execute(select(models.Product).where(models.Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    product.stock_quantity = quantity
    await db.commit()
    await db.refresh(product)
    return product
