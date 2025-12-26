from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    VIEWER = "VIEWER"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.VIEWER, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    saved_views = relationship("SavedView", back_populates="user")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    region = Column(String, index=True) # e.g., "North America", "Europe"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    orders = relationship("Order", back_populates="customer")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, index=True, nullable=False)
    price = Column(Float, nullable=False)
    cost = Column(Float, nullable=False) # For margin calc
    stock_quantity = Column(Integer, default=0)
    sku = Column(String, nullable=True, unique=True)
    low_stock_threshold = Column(Integer, default=10)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MarketingChannel(Base):
    __tablename__ = "marketing_channels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False) # e.g., "Google Ads", "Email"
    spend = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    total_amount = Column(Float, default=0.0)
    status = Column(String, default="completed")
    marketing_channel_id = Column(Integer, ForeignKey("marketing_channels.id"), nullable=True) # Attribution
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="orders")
    marketing_channel = relationship("MarketingChannel")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1)
    price_at_purchase = Column(Float, nullable=False) # Snapshot of price

    order = relationship("Order", back_populates="items")
    product = relationship("Product")

class AIInsightType(str, enum.Enum):
    TREND = "TREND"
    ANOMALY = "ANOMALY"
    PREDICTION = "PREDICTION"
    RECOMMENDATION = "RECOMMENDATION"

class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False) # e.g. TREND, ANOMALY
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SavedView(Base):
    __tablename__ = "saved_views"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    settings = Column(Text, nullable=False) # JSON blob for simplicity
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="saved_views")

class AlertRule(Base):
    __tablename__ = "alert_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    metric = Column(String, nullable=False) # REVENUE, ORDERS, AOV
    condition = Column(String, nullable=False) # GT, LT
    threshold = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_triggered_at = Column(DateTime(timezone=True), nullable=True)

class AlertNotification(Base):
    __tablename__ = "alert_notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("alert_rules.id"), nullable=True) # Optional in case rule deleted
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

