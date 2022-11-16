#/bin/bash
gpg --quiet --batch --yes --decrypt --passphrase='enter-passphrase-here' --output ../../.env env.gpg
