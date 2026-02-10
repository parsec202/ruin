import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm";

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

      // Basic validation
      if (!PROVIDER_URL || !RELAYER_PRIVATE_KEY || !RELAYER_CONTRACT) {
        return res.status(500).json({
          status: "Configuration Error",
          error: "Missing environment variables"
        });
      }

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

  // ============== POST REQUEST - RELAY ==============
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    // Get environment variables
    const PROVIDER_URL = process.env.BRISE_RPC;
    const RELAYER_PRIVATE_KEY = process.env.RELAYER_KEY;
    const RELAYER_CONTRACT = process.env.RELAYER_CONTRACT;

    // Validate env vars
    if (!PROVIDER_URL || !RELAYER_PRIVATE_KEY || !RELAYER_CONTRACT) {
      return res.status(500).json({
        success: false,
        error: "Server configuration error"
      });
    }

    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    const relayerWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);

    const RELAYER_ABI = [
      "function relay((address from,address target,bytes4 selector,bytes data,uint256 nonce,uint256 deadline) metaTx, bytes signature) external"
    ];

    const relayerContract = new ethers.Contract(
      RELAYER_CONTRACT,
      RELAYER_ABI,
      relayerWallet
    );

    // Parse request
    const { metaTx, signature } = req.body;

    // Validate input
    if (!metaTx || !signature) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing metaTx or signature in request body" 
      });
    }

    // Validate metaTx fields
    const requiredFields = ['from', 'target', 'selector', 'data', 'nonce', 'deadline'];
    for (const field of requiredFields) {
      if (metaTx[field] === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: `Missing required field: ${field}` 
        });
      }
    }

    console.log("Processing relay request:", {
      from: metaTx.from,
      target: metaTx.target,
      nonce: metaTx.nonce,
      relayerAddress: relayerWallet.address
    });

    // Send transaction
    const tx = await relayerContract.relay(metaTx, signature, {
      gasLimit: 500000
    });
    
    console.log("Transaction sent:", tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    
    console.log("Transaction confirmed:", receipt.hash);

    return res.status(200).json({ 
      success: true, 
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    });

  } catch (err) {
    console.error("Relay error:", {
      message: err.message,
      reason: err.reason,
      code: err.code
    });

    return res.status(500).json({ 
      success: false, 
      error: err.message || "Unknown error",
      reason: err.reason || null,
      code: err.code || null
    });
  }
}
