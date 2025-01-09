import {
    composeContext,
    elizaLogger,
    generateObjectDeprecated,
    ModelClass,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";
import { getToken } from "@lifi/sdk";
import { Symbiosis, Token, TokenAmount } from "symbiosis-js-sdk";
import { parseUnits } from "viem";
import { tron } from "viem/chains";
import { WRAPPED_TRX_ADDRESS } from "../constants";
import { initWalletProvider, WalletProvider } from "../providers/wallet";
import { bridgeTemplate } from "../templates";
import type { BridgeParams, Transaction } from "../types";

export { bridgeTemplate };

export class BridgeAction {
    private symbiosis: Symbiosis;

    constructor(private walletProvider: WalletProvider) {
        this.symbiosis = new Symbiosis("mainnet", "sdk-example-app");
    }

    async bridge(params: BridgeParams): Promise<Transaction> {
        const toChainConfig = this.walletProvider.getChainConfigs(
            params.toChain
        );

        const fromTokenInfo = await this.walletProvider.fetchOnchainToken(
            params.fromToken
        );

        const toTokenInfo = await getToken(toChainConfig.id, params.toToken);

        const fromToken = new Token({
            address: params.fromToken,
            chainId: tron.id,
            decimals: fromTokenInfo.decimals.toString(),
        });

        const toToken = new Token({
            address: params.toToken,
            chainId: toChainConfig.id,
            decimals: toTokenInfo.decimals,
        });

        const fromAmount = parseUnits(params.amount, fromToken.decimals);
        const tokenAmountIn = new TokenAmount(fromToken, fromAmount);
        const senderAddress = this.walletProvider.getAddress();

        const result = await this.symbiosis.swapExactIn({
            deadline: Date.now() + 20 * 60,
            from: senderAddress,
            to: params.toAddress,
            slippage: 300, //3%
            tokenAmountIn: tokenAmountIn,
            tokenOut: toToken,
        });

        const { transactionRequest, approveTo, transactionType } = result;

        if (transactionType !== "tron") {
            throw new Error("This Action only supports TRON wallets.");
        }

        if (!params.fromToken) {
            params.fromToken = WRAPPED_TRX_ADDRESS;
        }

        // Approve the token transfer if necessary
        if (params.fromToken !== WRAPPED_TRX_ADDRESS) {
            await this.walletProvider.approve(
                params.fromToken,
                approveTo,
                fromAmount
            );
        }

        const {
            call_value,
            contract_address,
            fee_limit,
            function_selector,
            owner_address,
            raw_parameter,
        } = transactionRequest;

        const tronWeb = this.walletProvider.tronWeb;

        const triggerResult =
            await tronWeb.transactionBuilder.triggerSmartContract(
                contract_address,
                function_selector,
                {
                    rawParameter: raw_parameter,
                    callValue: Number(call_value),
                    feeLimit: fee_limit,
                },
                [],
                owner_address
            );

        const signedTx = await tronWeb.trx.sign(triggerResult.transaction);
        const sendResult = await tronWeb.trx.sendRawTransaction(signedTx);

        return {
            hash: sendResult.transaction.txID,
            from: senderAddress,
            to: params.toAddress,
            value: BigInt(params.amount),
        };
    }
}

export const bridgeAction = {
    name: "bridge",
    description: "Bridge tokens between different chains using Symbiosis",
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options,
        callback?
    ) => {
        elizaLogger.log("Bridge action handler called");
        const walletProvider = await initWalletProvider(runtime);
        const action = new BridgeAction(walletProvider);

        // Compose bridge context
        const bridgeContext = composeContext({
            state,
            template: bridgeTemplate,
        });
        const content = await generateObjectDeprecated({
            runtime,
            context: bridgeContext,
            modelClass: ModelClass.LARGE,
        });

        const bridgeOptions: BridgeParams = {
            toChain: content.toChain,
            fromToken: content.token,
            toToken: content.token,
            toAddress: content.toAddress,
            amount: content.amount,
            slippage: content.slippage || 0.5,
        };

        try {
            const bridgeResp = await action.bridge(bridgeOptions);
            if (callback) {
                callback({
                    text: `Successfully bridged ${bridgeOptions.amount} ${bridgeOptions.fromToken} tokens from TRON to ${bridgeOptions.toChain}\nTransaction Hash: ${bridgeResp.hash}`,
                    content: {
                        success: true,
                        hash: bridgeResp.hash,
                        recipient: bridgeResp.to,
                    },
                });
            }
            return true;
        } catch (error) {
            console.error("Error in bridge handler:", error);
            if (callback) {
                callback({ text: `Error: ${error.message}` });
            }
            return false;
        }
    },
    template: bridgeTemplate,
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("TRON_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.length > 0;
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Bridge 1 TRX from TRON to ETHEREUM",
                    action: "CROSS_CHAIN_TRANSFER",
                },
            },
        ],
    ],
    similes: ["CROSS_CHAIN_TRANSFER", "CHAIN_BRIDGE", "MOVE_CROSS_CHAIN"],
};
