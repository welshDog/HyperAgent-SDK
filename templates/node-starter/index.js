// HyperAgent Node Starter
// Replace this with your actual agent logic!

function helloWorld(name) {
  return {
    message: `Hey ${name}, BROski is online! 🤖`,
    status: 'ok'
  };
}

// Quick test
const result = helloWorld('BROski');
console.log(result);

module.exports = { helloWorld };
