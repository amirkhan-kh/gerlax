from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    login: str
    role: str
    avatar: str | None = None


class UserStatOut(BaseModel):
    user_id: int
    last_seen_at: datetime | None
    active_seconds: int
    sales_count: int
    sales_sum: int


class ProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=5, max_length=32)
    avatar: str | None = None


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=5, max_length=32)
    login: str = Field(min_length=2, max_length=64)
    password: str = Field(min_length=4, max_length=72)
    role: str


class UserUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=5, max_length=32)
    login: str = Field(min_length=2, max_length=64)
    password: str | None = Field(default=None, max_length=72)
    role: str
