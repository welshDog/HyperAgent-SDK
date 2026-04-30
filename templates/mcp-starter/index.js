// HyperAgent MCP Starter — minimal MCP server skeleton
// Replace tool logic with your agent's real behaviour.
//
// Install the MCP SDK before running:
//   npm install @modelcontextprotocol/sdk
//
// Port 3200 follows HyperAgent convention: 3200-3299 = code agents.

const PORT = Number(process.env.PORT || 3200);

function helloWorld({ name }) {
  return {
    message: `Hey ${name}, BROski MCP is online! 🤖`,
    status: 'ok',
  };
}

const TOOLS = {
  hello_world: helloWorld,
};

async function main() {
  let createServer;
  try {
    ({ createServer } = require('@modelcontextprotocol/sdk/server'));
  } catch {
    console.error('✗ Missing dependency: @modelcontextprotocol/sdk');
    console.error('  Run: npm install @modelcontextprotocol/sdk');
    process.exit(1);
  }

  const server = createServer({
    name: 'my-mcp-agent',
    version: '0.1.0',
    tools: TOOLS,
  });

  await server.listen(PORT);
  console.log(`◆ MCP agent listening on :${PORT}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { helloWorld, TOOLS };
