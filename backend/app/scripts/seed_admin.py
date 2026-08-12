"""One-off script: create the first staff user. Run via
`docker compose exec backend python -m app.scripts.seed_admin`.
"""
import getpass

from app.database import SessionLocal
from app.models.user import User
from app.security import hash_password


def main() -> None:
    db = SessionLocal()
    try:
        username = input("Username: ").strip()
        if not username:
            print("Username is required.")
            return
        if db.query(User).filter(User.username == username).first():
            print(f"User '{username}' already exists.")
            return

        full_name = input("Full name: ").strip() or username
        password = getpass.getpass("Password: ")
        if not password:
            print("Password is required.")
            return

        user = User(
            username=username,
            hashed_password=hash_password(password),
            role="staff",
            full_name=full_name,
            is_active=True,
        )
        db.add(user)
        db.commit()
        print(f"Staff user '{username}' created.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
