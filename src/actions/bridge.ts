import { parseUnits } from "viem";
import {
    composeContext,
    generateObjectDeprecated,
    ModelClass,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";
import { initWalletProvider, WalletProvider } from "../providers/wallet";
import { bridgeTemplate } from "../templates";
import type { BridgeParams, Transaction } from "../types";
import { executeRoute, getRoutes } from "@lifi/sdk";

export { bridgeTemplate };

export class BridgeAction {
    private config;

    constructor(private walletProvider: WalletProvider) {
        this.config = walletProvider.getSdkConfig();
    }

    async bridge(params: BridgeParams): Promise<Transaction> {
        const fromAddress = this.walletProvider.getAddress();

        const fromChainConfig = this.walletProvider.getChainConfigs(
            params.fromChain
        );
        const toChainConfig = this.walletProvider.getChainConfigs(
            params.toChain
        );

        const routes = await getRoutes({
            fromChainId: fromChainConfig.id,
            toChainId: toChainConfig.id,
            fromTokenAddress: params.fromToken,
            toTokenAddress: params.toToken,
            fromAmount: parseUnits(params.amount, 6).toString(),
            fromAddress: fromAddress,
            toAddress: params.toAddress || fromAddress,
        });

        if (!routes.routes.length) throw new Error("No routes found");

        const execution = await executeRoute(routes.routes[0], this.config);
        const process = execution.steps[0]?.execution?.process[0];

        if (!process?.status || process.status === "FAILED") {
            throw new Error("Transaction failed");
        }

        return {
            hash: process.txHash as `0x${string}`,
            from: fromAddress,
            to: routes.routes[0].steps[0].estimate
                .approvalAddress as `0x${string}`,
            value: BigInt(params.amount),
            chainId: fromChainConfig.id,
        };
    }
}

export const bridgeAction = {
    name: "bridge",
    description: "Bridge tokens between different chains",
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options,
        callback?
    ) => {
        console.log("Bridge action handler called");
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
            fromChain: content.fromChain,
            toChain: content.toChain,
            fromToken: content.token,
            toToken: content.token,
            toAddress: content.toAddress,
            amount: content.amount,
        };

        try {
            const bridgeResp = await action.bridge(bridgeOptions);
            if (callback) {
                callback({
                    text: `Successfully bridged ${bridgeOptions.amount} ${bridgeOptions.fromToken} tokens from ${bridgeOptions.fromChain} to ${bridgeOptions.toChain}\nTransaction Hash: ${bridgeResp.hash}`,
                    content: {
                        success: true,
                        hash: bridgeResp.hash,
                        recipient: bridgeResp.to,
                        chain: bridgeOptions.fromChain,
                    },
                });
            }
            return true;
        } catch (error) {
            console.error("Error in bridge handler:", error.message);
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
                    text: "Bridge 1 ETH from Ethereum to Base",
                    action: "CROSS_CHAIN_TRANSFER",
                },
            },
        ],
    ],
    similes: ["CROSS_CHAIN_TRANSFER", "CHAIN_BRIDGE", "MOVE_CROSS_CHAIN"],
};
