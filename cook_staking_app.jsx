// cook-staking-app/src/App.jsx
import { useEffect, useState } from "react";
import {
  ThirdwebProvider,
  useWallet,
  useConnectWallet,
  useDisconnect,
  useActiveWalletConnectionStatus,
  ConnectButton,
} from "thirdweb/react";
import {
  createThirdwebClient,
  defineChain,
  getContract,
  toTokens,
} from "thirdweb";

const client = createThirdwebClient({
  clientId: "b2f0efa779d1c21ac55d26906bc544ae",
});

const base = defineChain(8453);
const STAKING_CONTRACT = "0x455145789A6EFC690883b9E2467051169A839766";
const COOK_TOKEN = "0xa26c15133463962514F9E6a31f44e6182841E59B"; // <-- replace with your real COOK token address

function StakingPage() {
  const wallet = useWallet();
  const { connect, isConnecting } = useConnectWallet();
  const disconnect = useDisconnect();
  const [cookBalance, setCookBalance] = useState("0");
  const [stakeAmount, setStakeAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    if (!wallet) return;
    const token = getContract({ client, chain: base, address: COOK_TOKEN });
    const balance = await token.read({ functionName: "balanceOf", args: [wallet.address] });
    const decimals = await token.read({ functionName: "decimals" });
    setCookBalance((Number(balance) / 10 ** decimals).toLocaleString());
  };

  const handleStake = async () => {
    if (!wallet || !stakeAmount) return;
    setLoading(true);
    try {
      const token = getContract({ client, chain: base, address: COOK_TOKEN });
      const decimals = await token.read({ functionName: "decimals" });
      const stakeContract = getContract({ client, chain: base, address: STAKING_CONTRACT });

      await token.write({
        functionName: "approve",
        args: [STAKING_CONTRACT, toTokens(stakeAmount, decimals)],
      });

      await stakeContract.write({
        functionName: "stake",
        args: [toTokens(stakeAmount, decimals)],
      });

      alert("Successfully staked!");
      setStakeAmount("");
      fetchBalance();
    } catch (err) {
      console.error(err);
      alert("Stake failed");
    }
    setLoading(false);
  };

  const handleClaim = async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const stakeContract = getContract({ client, chain: base, address: STAKING_CONTRACT });
      await stakeContract.write({ functionName: "claimRewards" });
      alert("Rewards claimed!");
    } catch (err) {
      console.error(err);
      alert("Claim failed");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBalance();
  }, [wallet]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">Stake COOK, Earn MCADE</h1>

      {!wallet ? (
        <button
          onClick={() => connect()}
          disabled={isConnecting}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      ) : (
        <>
          <p className="my-4">Your COOK Balance: {cookBalance}</p>

          <input
            type="number"
            placeholder="Amount to stake"
            className="text-black p-2 rounded mb-4"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
          />

          <button
            onClick={handleStake}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mb-4"
          >
            {loading ? "Staking..." : "Stake COOK"}
          </button>

          <button
            onClick={handleClaim}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            {loading ? "Claiming..." : "Claim Rewards"}
          </button>

          <button
            onClick={() => disconnect()}
            className="mt-6 underline text-sm text-gray-400 hover:text-white"
          >
            Disconnect
          </button>
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThirdwebProvider client={client} activeChain={base}>
      <StakingPage />
    </ThirdwebProvider>
  );
}
