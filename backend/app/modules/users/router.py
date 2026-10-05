from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.modules.users.models import User
from app.modules.users.schemas import ProfileUpdate, UserCreate, UserOut, UserStatOut, UserUpdate
from app.modules.users.service import UserService

router = APIRouter(prefix="/users", tags=["users"])
service = UserService()


@router.get("", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[User]:
    return await service.list_all(db)


@router.get("/stats", response_model=list[UserStatOut])
async def user_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[UserStatOut]:
    return await service.stats(db)


@router.patch("/me", response_model=UserOut)
async def update_profile(
    data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> User:
    return await service.update_profile(db, user, data)


@router.post("", response_model=UserOut)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> User:
    return await service.create(db, data)


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_admin),
) -> User:
    return await service.update(db, actor, user_id, data)


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_admin),
) -> None:
    await service.delete(db, actor, user_id)
