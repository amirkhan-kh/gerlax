from pydantic import BaseModel, ConfigDict, Field


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    login: str
    role: str


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
