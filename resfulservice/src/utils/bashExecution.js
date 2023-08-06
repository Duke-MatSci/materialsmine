const ssh = require('ssh2');

// SSH connection details for the host
const host = '';
const username = '';
const password = '';

// SSH client configuration
const sshConfig = {
  host,
  username,
  password
};

// Create a new SSH client
const sshClient = new ssh.Client();

const sshCommandExecution = async (config = sshConfig, command) => {
  // Return if command is missing
  if (!command) return;

  // Connect to the host
  sshClient.connect(config);

  // Execute the command on the host
  sshClient.on('ready', () => {
    sshClient.exec(command, (err, stream) => {
      if (err) {
        console.error(err);
        sshClient.end();
        process.exit(1);
      }
      stream.on('data', (data) => {
        console.log(data.toString());
      });
      stream.on('end', () => {
        sshClient.end();
        process.exit(0);
      });
    });
  });
};

module.exports = sshCommandExecution;
