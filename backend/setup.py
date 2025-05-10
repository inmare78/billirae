from setuptools import setup, find_packages

setup(
    name="billirae_backend",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "uvicorn",
        "pydantic",
        "pymongo",
        "motor",
        "python-jose",
        "passlib",
        "python-multipart",
        "reportlab",
        "qrcode",
        "pillow",
        "requests",
        "python-dotenv",
    ],
)
