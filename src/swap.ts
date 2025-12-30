import "dotenv/config";
import { request } from "undici";
import { ethers } from "ethers";

const WALLET_ABI = [
  "function nonce() view returns (uint256)",
  "function execute(address to,uint256 value,bytes data,bytes sigOwner2) returns (bytes)"
];

const ERC20_ABI = [
  "function approve(address spender,uint256 amount) external returns (bool)",
  "function allowance(address owner,address spender) external view returns (uint256)",
];

const RPC = process.env.RPC_BASE!;
const PK1 = process.env.PK1!; // executor (paga gas)
const PK2 = process.env.PK2!; // signer (firma EIP-712)
const WALLET_ADDRESS = process.env.WALLET!; // tu smart wallet
const CHAIN_ID = 8453;

const EURC = "0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42";
const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

const DECIMALS = 6;
const AMOUNT = ethers.parseUnits("0.5", DECIMALS);

const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID);
const executor = new ethers.Wallet(PK1, provider);
const signer2 = new ethers.Wallet(PK2);

const wallet = new ethers.Contract(
  WALLET_ADDRESS,
  WALLET_ABI,
  executor
);

function erc20(address: string) {
  return new ethers.Contract(address, ERC20_ABI, provider);
}

/* ---------- EIP-712 helpers ---------- */

async function signExecute(
  to: string,
  value: bigint,
  data: string
): Promise<string> {
  const nonce: bigint = await wallet.nonce();

  const domain = {
    name: "OceanCard Wallet",
    version: "1",
    chainId: CHAIN_ID,
    verifyingContract: WALLET_ADDRESS,
  };

  const types = {
    Execute: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "dataHash", type: "bytes32" },
      { name: "nonce", type: "uint256" },
    ],
  };

  const message = {
    to,
    value,
    dataHash: ethers.keccak256(data),
    nonce,
  };

  return signer2.signTypedData(domain, types, message);
}

/* ---------- Quote ---------- */

async function getQuote() {
  const body = JSON.stringify({
    user: WALLET_ADDRESS,
    originChainId: CHAIN_ID,
    destinationChainId: CHAIN_ID,
    originCurrency: USDC,
    destinationCurrency: EURC,
    amount: AMOUNT.toString(),
    tradeType: "EXACT_INPUT",
  });

  const { body: res } = await request(
    "https://api.relay.link/quote",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body,
    }
  );

const data = (await res.json()) as any;
return data;
}

/* ---------- Allowance desde la WALLET ---------- */

async function ensureAllowance(
  token: string,
  spender: string
) {
  const c = erc20(token);
  const allowance = await c.allowance(WALLET_ADDRESS, spender);

  if (allowance >= AMOUNT) return;

  console.log(`🔓 Approving ${token} → ${spender}`);

  const data = new ethers.Interface(ERC20_ABI).encodeFunctionData(
    "approve",
    [spender, ethers.MaxUint256]
  );

  const sig = await signExecute(token, 0n, data);

  const tx = await wallet.execute(token, 0n, data, sig);
  console.log("⏳ TX approve:", tx.hash);
  await tx.wait();
}

/* ---------- Ejecutar steps ---------- */

async function executeSteps(quote: any) {
  const inputToken = quote.details.currencyIn.currency.address;

  for (const step of quote.steps) {
    for (const item of step.items) {
      if (!item?.data) continue;

      const tx = item.data;

      console.log(`✍️ Step: ${step.id}`);

      await ensureAllowance(inputToken, tx.to);

      const sig = await signExecute(
        tx.to,
        BigInt(tx.value ?? 0),
        tx.data
      );

      const sent = await wallet.execute(
        tx.to,
        BigInt(tx.value ?? 0),
        tx.data,
        sig,
        {
          maxFeePerGas: BigInt(tx.maxFeePerGas),
          maxPriorityFeePerGas: BigInt(tx.maxPriorityFeePerGas),
        }
      );

      console.log("⏳ TX:", sent.hash);
      await sent.wait();
    }
  }
}

/* ---------- Main ---------- */

async function main() {
  console.log("📡 Quote");
  const quote = await getQuote();

  console.log(
    `💱 Recibirás ~${quote.details.currencyOut.amountFormatted} EURC`
  );

  await executeSteps(quote);
  console.log("✅ Swap completado");
}

main().catch((e) => {
  console.error("ERROR:", e.response?.data ?? e.message);
});