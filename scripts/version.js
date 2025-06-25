const fs = require('fs');
const path = require('path');

function incrementVersion() {
  const packagePath = path.join(process.cwd(), 'package.json');
  const package = require(packagePath);
  
  const [major, minor, patch, build] = package.version.split('.');
  const newBuild = parseInt(build || 0) + 1;
  
  package.version = `${major}.${minor}.${patch}.${newBuild}`;
  
  fs.writeFileSync(packagePath, JSON.stringify(package, null, 2) + '\n');
  console.log(`Version updated to ${package.version}`);
}

incrementVersion();