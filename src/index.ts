import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config()

const BASE_RPC = "https://mainnet.base.org";

const PK1 = process.env.PK1
const PK2 = process.env.PK2

import { createWallet } from "./createWallet.js";
import { getSalt, createSalt } from "./salt.js";
import { transferUSDC } from "./transfer.js";

const wallet1 = new ethers.Wallet(PK1)
const wallet2 = new ethers.Wallet(PK2)

const transferTest = await transferUSDC(process.env.WALLET, process.env.PK1, process.env.PK2, "0x82369D53005A63f148a157506E4d787e9abDeF3E", 1_000_000n)

console.log(transferTest)

/*
const salt = createSalt(
  wallet1.address,
  wallet2.address,
  6
)

const wallet = await createWallet(
  PK1,
  PK2,
  salt
)

console.log("Wallet creada en Base:", wallet)
*/