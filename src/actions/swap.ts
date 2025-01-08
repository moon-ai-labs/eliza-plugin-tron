import type { IAgentRuntime, Memory, State } from "@elizaos/core";
import {
    composeContext,
    generateObjectDeprecated,
    ModelClass,
} from "@elizaos/core";

import { initWalletProvider, WalletProvider } from "../providers/wallet";
import { swapTemplate } from "../templates";
import type { SwapParams, Transaction } from "../types";

export { swapTemplate };

export class SwapAction {
    constructor(private walletProvider: WalletProvider) {}

    async swap(params: SwapParams): Promise<Transaction> {
        const tronWeb = this.walletProvider.tronWeb;
        const fromAddress = tronWeb.defaultAddress.base58;

        const chainConfig = this.walletProvider.getChainConfigs(params.chain);

        if (!chainConfig) {
            throw new Error(`Unsupported chain: ${params.chain}`);
        }

        const fromAmountSun = tronWeb.toSun(parseFloat(params.amount));

        try {
            // Simulate token swap logic
            console.log(
                `Performing swap on chain: ${params.chain}\nFrom: ${params.fromToken}\nTo: ${params.toToken}\nAmount: ${params.amount} (${fromAmountSun} SUN)`
            );
            if (!fromAddress) {
                throw new Error("No address found");
            }
            // This is placeholder logic for interacting with Tron-specific DEX or smart contract.
            const transaction =
                await tronWeb.transactionBuilder.triggerSmartContract(
                    params.fromToken, // Example contract address for token
                    "swap", // Example contract method name
                    {
                        feeLimit: 10000000, // Example fee limit
                    },
                    [
                        {
                            type: "address",
                            value: params.toToken,
                        },
                        {
                            type: "uint256",
                            value: fromAmountSun,
                        },
                    ],
                    fromAddress
                );

            const signedTransaction = await tronWeb.trx.sign(
                transaction.transaction
            );
            const result = await tronWeb.trx.sendRawTransaction(
                signedTransaction
            );

            return {
                hash: result.transaction.txID,
                from: fromAddress,
                to: params.toToken,
                value: BigInt(fromAmountSun.toString()),
                data: JSON.stringify(transaction),
                chainId: chainConfig.id,
            };
        } catch (error) {
            throw new Error(`Swap failed: ${error.message}`);
        }
    }
}

export const swapAction = {
    name: "swap",
    description: "Swap tokens on the same chain",
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback?: any
    ) => {
        console.log("Swap action handler called");
        const walletProvider = await initWalletProvider(runtime);
        const action = new SwapAction(walletProvider);

        // Compose swap context
        const swapContext = composeContext({
            state,
            template: swapTemplate,
        });
        const content = await generateObjectDeprecated({
            runtime,
            context: swapContext,
            modelClass: ModelClass.LARGE,
        });

        const swapOptions: SwapParams = {
            chain: content.chain,
            fromToken: content.inputToken,
            toToken: content.outputToken,
            amount: content.amount,
            slippage: content.slippage,
        };

        try {
            const swapResp = await action.swap(swapOptions);
            if (callback) {
                callback({
                    text: `Successfully swapped ${swapOptions.amount} ${swapOptions.fromToken} for ${swapOptions.toToken}\nTransaction Hash: ${swapResp.hash}`,
                    content: {
                        success: true,
                        hash: swapResp.hash,
                        recipient: swapResp.to,
                        chain: content.chain,
                    },
                });
            }
            return true;
        } catch (error) {
            console.error("Error in swap handler:", error.message);
            if (callback) {
                callback({ text: `Error: ${error.message}` });
            }
            return false;
        }
    },
    template: swapTemplate,
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("TRON_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.length > 0;
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Swap 1 TRX for USDT on Tron",
                    action: "TOKEN_SWAP",
                },
            },
        ],
    ],
    similes: ["TOKEN_SWAP", "EXCHANGE_TOKENS", "TRADE_TOKENS"],
};
