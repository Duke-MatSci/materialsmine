# Set Up Development Environment Variable
- Download gpg [here](https://gpgtools.org/) and request decryption keys for `envVarFile.gpg`

On the terminal:
- Request passphrase from repo admin to decript `env.gpg` file
- For example if the passphrase recieved is `JWl90`
- Open `decryptENVARFile.sh` file
- Paste passphrase between the provided quote like so - `gpg --quiet --batch --yes --decrypt --passphrase='JWl90' --output ../../.env env.gpg`
- Save file `decryptENVARFile.sh`
- Run `bash deployenv.sh` in your terminal to decrypt `env.gpg` content into the root directory and you are all set.

## :warning No need to copy and paste environment variable. Docker compose picks it up at startup