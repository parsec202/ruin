export default async function handler(req, res) {
  const envCheck = {
    BRISE_RPC: !!process.env.BRISE_RPC,
    RELAYER_KEY: !!process.env.RELAYER_KEY,
    RELAYER_CONTRACT: !!process.env.RELAYER_CONTRACT,
  };

  const allPresent = Object.values(envCheck).every(v => v);

  return res.status(allPresent ? 200 : 500).json({
    status: allPresent ? "OK" : "ERROR",
    environment: envCheck,
    timestamp: new Date().toISOString()
  });
}
