import os
import base64

# Generate a 32-byte (256-bit) random key
secret_key = base64.urlsafe_b64encode(os.urandom(32)).decode()
print(secret_key)