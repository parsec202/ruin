import { ethers } from "ethers";

// Environment variables
const PROVIDER_URL = process.env.BRISE_RPC!;
const RELAYER_PRIVATE_KEY = process.env.RELAYER_KEY!;
const RELAYER_CONTRACT = process.env.RELAYER_CONTRACT!;

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const relayerWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
const relayerContract = new ethers.Contract(
  RELAYER_CONTRACT,
  [
    "function relay((address from,address target,bytes4 selector,bytes data,uint256 nonce,uint256 deadline) metaTx, bytes signature) external"
  ],
  relayerWallet
);

export default async function handler(req: any, res: any) {
  try {
    const { metaTx, signature } = req.body;

    const tx = await relayerContract.relay(metaTx, signature);
    const receipt = await tx.wait();

    res.status(200).json({ success: true, txHash: receipt.transactionHash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}
