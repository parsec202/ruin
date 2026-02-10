export default async function handler(req, res) {
  // ============== CORS HEADERS ==============
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ============== GET REQUEST - SIMPLE STATUS ==============
  if (req.method === "GET") {
    try {
      const PROVIDER_URL = process.env.BRISE_RPC;
      const RELAYER_PRIVATE_KEY = process.env.RELAYER_KEY;
      const RELAYER_CONTRACT = process.env.RELAYER_CONTRACT;

      // Simple response zonder blockchain calls
      return res.status(200).json({
        status: "Relayer API Online",
        contractAddress: RELAYER_CONTRACT,
        timestamp: new Date().toISOString(),
        usage: {
          method: "POST",
          endpoint: "/api/relayer",
          body: {
            metaTx: {
              from: "address",
              target: "address",
              selector: "bytes4",
              data: "bytes",
              nonce: "uint256",
              deadline: "uint256"
            },
            signature: "bytes"
          }
        }
      });
    } catch (err) {
      return res.status(500).json({
        status: "Error",
        error: err.message
      });
    }
  }
}
