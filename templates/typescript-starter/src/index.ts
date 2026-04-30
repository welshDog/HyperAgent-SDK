// HyperAgent TypeScript Starter
// Replace this with your actual agent logic!

interface HelloResult {
  message: string;
  status: 'ok' | 'error';
}

export function helloWorld(name: string): HelloResult {
  return {
    message: `Hey ${name}, BROski is online! 🤖`,
    status: 'ok',
  };
}

if (require.main === module) {
  const result = helloWorld('BROski');
  console.log(result);
}
