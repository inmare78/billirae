import logging
import motor.motor_asyncio
from billirae_backend.app.core.config import settings

logger = logging.getLogger(__name__)

class MongoDB:
    client = None
    db = None

async def connect_to_mongo():
    """Connect to MongoDB."""
    logger.info("Connecting to MongoDB...")
    MongoDB.client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
    MongoDB.db = MongoDB.client[settings.MONGODB_DB_NAME]
    logger.info("Connected to MongoDB")

async def close_mongo_connection():
    """Close MongoDB connection."""
    logger.info("Closing MongoDB connection...")
    if MongoDB.client:
        MongoDB.client.close()
        logger.info("MongoDB connection closed")
