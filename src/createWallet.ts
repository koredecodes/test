import { ethers } from "ethers"
import dotenv from "dotenv"

dotenv.config()

const BASE_RPC = "https://mainnet.base.org"
const FACTORY_ADDRESS = "0x2c2Eac275D4842516C95F68d021a2B894D4D615a"

const FACTORY_ABI = [
  "function deploy(address owner1, address owner2, bytes32 salt) returns (address)",
  "function predict(bytes32) view returns (address)"
]

const WALLET_BYTECODE = process.env.bytecode

export async function createWallet(
  pk1: string,
  pk2: string,
  salt: string
): Promise<string> {
  const provider = new ethers.JsonRpcProvider(BASE_RPC)

  // pk1 = deployer + gas payer
  const signer1 = new ethers.Wallet(pk1, provider)

  const owner1 = await signer1.getAddress()
  const owner2 = new ethers.Wallet(pk2).address

  const factory = new ethers.Contract(
    FACTORY_ADDRESS,
    FACTORY_ABI,
    signer1
  )

  // 🔮 1. CALCULAR ADDRESS CORRECTA (CREATE2)
  const walletAddress = await factory.predict(salt)

  // 🧱 2. DEPLOY (si ya existe, revertirá o no hará nada según tu factory)
  const tx = await factory.deploy(owner1, owner2, salt)
  await tx.wait()

  // ✅ 3. DEVOLVER SIEMPRE LA ADDRESS REAL
  return walletAddress
}