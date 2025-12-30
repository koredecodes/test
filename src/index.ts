import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config()

const BASE_RPC = "https://mainnet.base.org";
const FACTORY_ADDRESS = "0x2c2Eac275D4842516C95F68d021a2B894D4D615a";

const PK1 = process.env.PK1
const PK2 = process.env.PK2

import { createWallet } from "./createWallet.js";
import { getSalt, createSalt } from "./salt.js";

const wallet1 = new ethers.Wallet(PK1)
const wallet2 = new ethers.Wallet(PK2)

/*

const provider = new ethers.JsonRpcProvider("https://mainnet.base.org")

const runtimeBytecode = await provider.getCode(FACTORY_ADDRESS)

console.log("Runtime bytecode:", runtimeBytecode)

*/

const salt = createSalt(
  wallet1.address,
  wallet2.address,
  5
)

console.log(
    salt
)

const wallet = await createWallet(
  PK1,
  PK2,
  salt
)

console.log(
    getSalt(wallet1.address, wallet2.address, 5)
)

console.log("Wallet creada en Base:", wallet)