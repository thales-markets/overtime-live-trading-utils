export type NetworkParams = {
    chainId: string;
    chainName: string;
    shortChainName: string;
    chainKey: string;
    iconClassName: string;
    rpcUrls: string[];
    blockExplorerUrls: string[];
    iconUrls: string[];
    fraudProofWindow?: number;
    nativeCurrency: {
        symbol: string;
        decimals: number;
    };
    order: number;
};
