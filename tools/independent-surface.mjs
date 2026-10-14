/* Separate deployment repositories must not report successful no-op validation. */
const surface=process.argv[2];
if(!['documentation','studio'].includes(surface))throw Error('Unknown independent surface');
const repository=surface==='documentation'?'artanrecords-docs':'artanrecords-studio';
console.error(`${surface} is owned by the independent ${repository} repository. Run its build/check there; this command does not validate that deployment.`);
process.exitCode=1;
