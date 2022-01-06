1. Download gpg [here](https://gpgtools.org/) and request decryption keys for `envVarFile.gpg`

On the terminal:
2. Decrypt `envVarFile.gpg` content by executing `decryptENVARFile.sh` in this directory
3. Go to => `~/.bash_profile` (If not found create one)
4. Scroll down to the end of the `.bash_profile` file
5. Copy and paste `envVarFile` content
6. Save any changes you made to the `.bash_profile` file
7. Execute the new .bash_profile by running => `source ~/.bash-profile`