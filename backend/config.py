from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Pydantic-settings will automatically look for environment variables
    matching the attribute names (case-insensitive).
    """
    DATABASE_URL: str = "postgresql://user:password@db/mydatabase"
    SECRET_KEY: str = "a_very_secret_key_that_should_be_in_env_vars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        # This tells pydantic-settings where to look for a .env file.
        # It's useful for local development.
        env_file = ".env"

# Create a single instance of the settings to be used throughout the application
settings = Settings()