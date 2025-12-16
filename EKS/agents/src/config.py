"""
Configuration management using Pydantic Settings
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""
    
    # Server
    environment: str = "development"
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Neo4j
    neo4j_uri: str
    neo4j_user: str
    neo4j_password: str
    
    # MongoDB
    mongodb_uri: str
    mongodb_database: str = "eks"
    
    # Azure OpenAI
    azure_openai_endpoint: str
    azure_openai_api_key: str
    azure_openai_deployment_name: str = "gpt-4o"
    azure_embedding_deployment_name: str = "text-embedding-3-small"
    
    # Agno
    agno_log_level: str = "INFO"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


settings = Settings()
