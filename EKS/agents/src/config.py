"""
Configuration management using Pydantic Settings
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application settings"""
    
    # Server
    port: int = 8000
    environment: str = "development"
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]
    
    # Neo4j
    neo4j_uri: str = Field(alias="NEO4J_URI")
    neo4j_user: str = Field(alias="NEO4J_USERNAME")
    neo4j_password: str = Field(alias="NEO4J_PASSWORD")
    
    # Azure OpenAI
    azure_openai_endpoint: str = Field(alias="AZURE_OPENAI_ENDPOINT")
    azure_openai_api_key: str = Field(alias="AZURE_OPENAI_KEY")
    azure_openai_api_version: str = Field(default="2024-08-01-preview", alias="AZURE_OPENAI_API_VERSION")
    azure_openai_deployment_name: str = Field(default="gpt-4o-mini-aion", alias="AZURE_OPENAI_DEPLOYMENT_NAME")
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        populate_by_name=True,
    )


settings = Settings()
