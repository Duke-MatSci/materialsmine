- Download gpg [here](https://gpgtools.org/) and request decryption keys for `envVarFile.gpg`

On the terminal:
- Decrypt `envVarFile.gpg` content by executing `decryptENVARFile.sh` in this directory
- Go to => `~/.bash_profile` (If not found create one)
- Scroll down to the end of the `.bash_profile` file
- Copy and paste `envVarFile` content
- Save any changes you made to the `.bash_profile` file
- Execute the new .bash_profile by running => `source ~/.bash-profile`