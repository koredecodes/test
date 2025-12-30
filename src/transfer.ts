import { ethers } from "ethers"

const BASE_RPC = "https://mainnet.base.org"

//const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
const USDC_BASE = "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42"

const WALLET_ABI = [
  "function nonce() view returns (uint256)",
  "function execute(address,uint256,bytes,bytes) returns (bytes)"
]

const ERC20_ABI = [
  "function transfer(address to,uint256 amount) returns (bool)"
]

export async function transferUSDC(
  walletAddress: string,
  pk1: string,
  pk2: string,
  to: string,
  amount: bigint
): Promise<string> {
  const provider = new ethers.JsonRpcProvider(BASE_RPC)

  // pk1 paga gas
  const signer1 = new ethers.Wallet(pk1, provider)

  // pk2 solo firma
  const signer2 = new ethers.Wallet(pk2)

  const wallet = new ethers.Contract(
    walletAddress,
    WALLET_ABI,
    signer1
  )

  const nonce: bigint = await wallet.nonce()
  const chainId = (await provider.getNetwork()).chainId

  // calldata ERC20.transfer
  const erc20 = new ethers.Interface(ERC20_ABI)
  const data = erc20.encodeFunctionData("transfer", [to, amount])

  // ---------- EIP-712 ----------
  const domain = {
    name: "OceanCard Wallet",
    version: "1",
    chainId,
    verifyingContract: walletAddress
  }

  const types = {
    Execute: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "dataHash", type: "bytes32" },
      { name: "nonce", type: "uint256" }
    ]
  }

  const message = {
    to: USDC_BASE,
    value: 0n,
    dataHash: ethers.keccak256(data),
    nonce
  }

  // 🔑 pk2 firma EIP-712
  const sigOwner2 = await signer2.signTypedData(
    domain,
    types,
    message
  )

  // 🚀 pk1 ejecuta y paga gas
  const tx = await wallet.execute(
    USDC_BASE,
    0n,
    data,
    sigOwner2
  )

  await tx.wait()

  return tx.hash
}