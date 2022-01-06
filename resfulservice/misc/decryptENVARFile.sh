#/bin/bash
gpg --quiet --batch --yes --decrypt --passphrase='$passphrase' --output ./envVarFile envVarFile.gpg