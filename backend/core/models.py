"""Pydantic models shared across endpoints."""
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Literal


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Literal["admin", "driver", "client"] = "client"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str


class DeliveryCreate(BaseModel):
    recipient_name: str
    recipient_address: str
    recipient_phone: str
    package_description: str
    weight_kg: float = 1.0
    client_id: Optional[str] = None
    driver_id: Optional[str] = None


class DeliveryUpdate(BaseModel):
    status: Optional[Literal["pending", "assigned", "in_transit", "delivered", "failed"]] = None
    driver_id: Optional[str] = None
    signature_data: Optional[str] = None
    delivery_notes: Optional[str] = None


class InvoiceCreate(BaseModel):
    delivery_id: str
    amount: float
    client_id: str


class DamageReportCreate(BaseModel):
    delivery_id: str
    photo_base64: str
    description: Optional[str] = None


class EcoScoreUpdate(BaseModel):
    harsh_braking_count: int = 0
    harsh_acceleration_count: int = 0
    distance_km: float = 0
    fuel_liters: float = 0


class OfflineSyncData(BaseModel):
    deliveries: List[dict] = []
    damage_reports: List[dict] = []
    signatures: List[dict] = []


class ChatMessage(BaseModel):
    message: str
    history: List[dict] = []


class CompanyOnboarding(BaseModel):
    company_name: str
    siret: str
    tva_intra: str = ""
    address: str


class DriverCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    vehicle_plate: Optional[str] = None


class SubscriptionUpdate(BaseModel):
    plan: Literal["solo", "croissance", "flotte_pro"]
    billing_cycle: Literal["monthly", "yearly"]


class NotificationCreate(BaseModel):
    user_id: str
    type: str
    title: str
    message: str
    delivery_id: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class TwoFactorVerify(BaseModel):
    challenge_token: str
    code: str = Field(..., min_length=6, max_length=6)


class UserPreferences(BaseModel):
    language: Optional[Literal["fr", "en", "es"]] = None
    notification_prefs: Optional[dict] = None
    two_fa_enabled: Optional[bool] = None


class LogoUpload(BaseModel):
    logo_base64: str = Field(..., min_length=10, max_length=800_000)


class DeleteAccountRequest(BaseModel):
    password: str
    confirmation: Literal["SUPPRIMER"]
