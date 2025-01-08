# eliza-plugin-tron

This plugin provides actions and providers for interacting with TRON blockchain.

## Description

The TRON plugin provides comprehensive functionality for interacting with TRON blockchain, including token transfers, cross-chain bridging, and token swaps using LiFi integration.

## Features

-   Multi-chain support with dynamic chain configuration
-   Native token transfers
-   Cross-chain token bridging via LiFi
-   Token swapping on supported DEXs
-   Wallet balance tracking
-   Custom RPC endpoint configuration
-   Automatic retry mechanisms
-   Comprehensive transaction management

## Installation

```bash
yarn install eliza-plugin-tron
```

## Configuration

### Required Environment Variables

```env
# Required
TRON_PRIVATE_KEY=your-private-key-here

# Optional - Custom RPC URLs
TRON_PROVIDER_URL=https://your-custom-tron-rpc-url
```

### Custom RPC URLs

By default, the RPC URL is inferred from the `viem/chains` config. To use a custom RPC URL add the following to your `.env` file:

```env
TRON_PROVIDER_URL=https://your-custom-tron-rpc-url
```

**Example usage:**

```env
TRON_PROVIDER_URL=https://tron-network.rpc.thirdweb.com
```

## Provider

The **Wallet Provider** initializes with the **TRON**. It:

-   Provides the **context** of the currently connected address and its balance.
-   Creates **Public** and **Wallet clients** to interact with the supported chains.

## Actions

### 1. Transfer

Transfer native tokens on the same chain:

```typescript
// Example: Transfer 1 TRX
Send 100 TRX  to TH9husb1dF7q8KSe7PVdmZYKqfnuYw5KWL
```

### 2. Bridge

Bridge tokens between different chains using LiFi:

```typescript
// Example: Bridge TRX from TRON to Base
Bridge 1 TRX from TRON to Base
```

### 3. Swap

Swap tokens on the same chain using LiFi:

```typescript
// Example: Swap TRX for USDC
Swap 1 TRX for USDC on TRON
```

## Development

1. Clone the repository
2. Install dependencies:

```bash
yarn install
```

3. Build the plugin:

```bash
yarn run build
```

4. Run tests:

```bash
yarn test
```

## API Reference

### Core Components

1. **WalletProvider**

    - Manages wallet connections
    - Handles chain switching
    - Manages RPC endpoints
    - Tracks balances

2. **Actions**
    - TransferAction: Native token transfers
    - BridgeAction: Cross-chain transfers
    - SwapAction: Same-chain token swaps

## Future Enhancements

1. **Cross-Chain Operations**

    - Enhanced bridge aggregation
    - Multi-chain transaction batching
    - Cross-chain liquidity management
    - Bridge fee optimization
    - Chain-specific gas strategies
    - Cross-chain messaging

2. **DeFi Integration**

    - Advanced swap routing
    - Yield farming automation
    - Liquidity pool management
    - Position management tools
    - MEV protection features
    - Flash loan integration

3. **Smart Contract Management**

    - Contract deployment templates
    - Verification automation
    - Upgrade management
    - Security analysis tools
    - Gas optimization
    - ABI management system

4. **Token Operations**

    - Batch transfer tools
    - Token approval management
    - Token metadata handling
    - Custom token standards
    - Token bridging optimization
    - NFT support enhancement

5. **Wallet Features**

    - Multi-signature support
    - Account abstraction
    - Hardware wallet integration
    - Social recovery options
    - Transaction simulation
    - Batch transaction processing

6. **Network Management**

    - Dynamic RPC management
    - Network health monitoring
    - Fallback provider system
    - Custom network addition
    - Gas price optimization
    - Network analytics

7. **Security Enhancements**

    - Transaction validation
    - Risk assessment tools
    - Fraud detection
    - Rate limiting
    - Emergency shutdown
    - Audit integration

8. **Developer Tools**
    - Enhanced debugging
    - Testing framework
    - Documentation generator
    - CLI improvements
    - Performance profiling
    - Integration templates

We welcome community feedback and contributions to help prioritize these enhancements.

## Contributing

The plugin contains tests. WhTRXer you're using **TDD** or not, please make sure to run the tests before submitting a PR:

```bash
yarn test
```
