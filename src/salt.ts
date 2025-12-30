import { ethers } from "ethers"

const WALLET_NAMESPACE = "OceanCard_v1"

export function createSalt(
  address1: string,
  address2: string,
  walletIndex: number
): string {
  return ethers.keccak256(
    ethers.solidityPacked(
      ["string", "address", "address", "uint256"],
      [WALLET_NAMESPACE, address1, address2, walletIndex]
    )
  )
}

export function getSalt(
  address1: string,
  address2: string,
  walletIndex: number
): string {
  return createSalt(address1, address2, walletIndex)
}