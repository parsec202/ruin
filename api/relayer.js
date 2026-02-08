import { ethers } from "ethers";

// Types
interface MetaTx {
  from: string;
  target: string;
  selector: string;
  data: string;
  nonce: number | string;
  deadline: number | string;
}

interface RelayRequest {
  metaTx: MetaTx;
  signature: string;
}

// Environment variables
const PROVIDER_URL = process.env.BRISE_RPC!;
const RELAYER_PRIVATE_KEY = process.env.RELAYER_KEY!;
const RELAYER_CONTRACT = process.env.RELAYER_CONTRACT!;

// Validatie
if (!PROVIDER_URL || !RELAYER_PRIVATE_KEY || !RELAYER_CONTRACT) {
  throw new Error("Missing required environment variables");
}

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

export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { metaTx, signature }: RelayRequest = req.body;

    // Validatie
    if (!metaTx || !signature) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing metaTx or signature" 
      });
    }

    // Validate metaTx fields
    const requiredFields = ['from', 'target', 'selector', 'data', 'nonce', 'deadline'];
    for (const field of requiredFields) {
      if (!metaTx[field as keyof MetaTx]) {
        return res.status(400).json({ 
          success: false, 
          error: `Missing required field: ${field}` 
        });
      }
    }

    // Log voor debugging (verwijder in productie)
    console.log("Relayer wallet:", relayerWallet.address);
    console.log("MetaTx:", metaTx);
    console.log("Signature:", signature);

    // Check relayer balance (optioneel maar handig)
    const balance = await relayerWallet.provider.getBalance(relayerWallet.address);
    console.log("Relayer balance:", ethers.formatEther(balance), "ETH");

    // Verstuur transactie
    const tx = await relayerContract.relay(metaTx, signature, {
      gasLimit: 500000 // Optioneel: stel een gas limit in
    });
    
    console.log("Transaction sent:", tx.hash);

    // Wacht op confirmatie
    const receipt = await tx.wait();
    
    console.log("Transaction confirmed:", receipt.hash);
    console.log("Gas used:", receipt.gasUsed.toString());

    return res.status(200).json({ 
      success: true, 
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    });

  } catch (err: any) {
    console.error("Error details:", {
      message: err.message,
      reason: err.reason,
      code: err.code,
      data: err.data
    });

    // Geef meer details terug voor debugging
    return res.status(500).json({ 
      success: false, 
      error: err.message,
      reason: err.reason || "Unknown error",
      code: err.code || "UNKNOWN"
    });
  }
}
