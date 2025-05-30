"use client";
import { useState, useEffect } from "react";
import { 
  BrowserWallet, connect, disconnect, 
  getEvent, getConnection, isInstalled 
} from "@pwrjs/browser-wallet";
import { syncPosts } from "@/components/syncPosts";

export const vidaId = 5544;
const timestamp = new Date().getTime();

// Format post timestamp
const formatTimestamp = (t) => {
	const diff = Date.now() - t;
	for (const [label, value] of [['y', 31536000000], ['d', 86400000], ['h', 3600000], ['m', 60000], ['s', 1000]]) {
		const count = Math.floor(diff / value);
		if (count) return `${count}${label}`;
	}
	return '0s';
};

export default function Home() {
	// Create a new pwr wallet
	const pwr = new BrowserWallet();
	// Check if the user's wallet is connected
	const [connected, setConnected] = useState(false);
	// State variable to store wallet address connected
	const [address, setAddress] = useState(null);
	// State variable to store post content
	const [content, setContent] = useState("");
	// State variable to store all posts fetched
	const [posts, setPosts] = useState([]);

	// Connect wallet with the website
	const connectWallet = async () => {
		const res = await connect();
		// Check if the connect completed
		res && setConnected(true);
	}

	// Disconnect wallet from the website
	const disconnectWallet = async () => {
		const res = await disconnect();
		// Check if the disconnect completed
		(!res) && setConnected(false);
	}

	// Send `post` data using PWR SDK and PWR Wallet
	const sendPost = async () => {
		// Post structure
		const data = {
			type: "post",
			post: content,
			timestamp: timestamp,
			sender: address,
			id: posts.length > 0 ? posts[posts.length - 1].id + 1 : 0,
		};
		// Convert data type to `Buffer`
		const post = Buffer.from(JSON.stringify(data), 'utf8');

		try {
			// Send `post` to our vidaId
			const tx = await pwr.sendVidaData(vidaId, post, true);
			alert(`SENT POST! ${tx.slice(0, 6)}...${tx.slice(-6)}`);
		} catch (err) {
			console.error(err);
		}
	}

	// Send `like` data using PWR SDK and PWR Walletb
	const sendLike = async (postId) => {
		try {
			for (let i=0; i <= posts.length; i++) {
				if (posts[i]?.id === postId) {
					// Like structure
					const data = {
						type: "like",
						likes: posts[i]?.likes + 1,
						postId: postId,
						timestamp: timestamp,
						sender: address,
					};
					// Convert data type to `Buffer`
					const likes = Buffer.from(JSON.stringify(data), 'utf8');

					// Send `like` to our vidaId
					const tx = await pwr.sendVidaData(vidaId, likes, true);
					alert(`SENT LIKE! ${tx.slice(0, 6)}...${tx.slice(-6)}`);
				}
			}
		} catch (err) {
			console.error(err);
		}
  	}

	// Piece of code that runs everytime the user's wallet changes or disconnected
	useEffect(() => {
		// Check if pwr wallet already installed
		if (isInstalled()) {
			// Used to re-fetch the connected user's account every time
			// the website is refreshed.
			getConnection().then(addressConnected => {
				if (addressConnected && address == null) {
					setConnected(true);
					setAddress(addressConnected);
				}
			});

			// Used to listen to any account changes that occur in the wallet.
			getEvent("onAccountChange", (addresses) => {
				setAddress(addresses[0]);
				console.log("Account changed to: ", addresses[0]);
				setConnected(addresses.length > 0);
			});

			// Fetch the posts from `syncPosts` to our state variable `posts`
			syncPosts(setPosts);
		}
	}, [posts, address]);

	return (
		<div>
			<nav className="relative z-2 w-full md:static md:text-sm md:border-none">
				<div className="items-center gap-x-14 px-4 max-w-screen-xl mx-auto md:flex md:px-8">
				<div className="flex items-center justify-between py-3 md:py-5 md:block text-lg text-white">
					<a>
					Social Fi
					</a>
				</div>
				<div className="nav-menu flex-1 pb-3 mt-8 md:block md:pb-0 md:mt-0">
					<ul className="items-center space-y-6 md:flex md:space-x-6 md:space-x-reverse md:space-y-0">
					<div className='flex-1 items-center justify-end gap-x-6 space-y-3 md:flex md:space-y-0'>
						
						<li>
						{connected ? (
							<button
							onClick={disconnectWallet}
							className="block py-3 px-4 font-medium text-center text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 active:shadow-none rounded-lg shadow md:inline"
							>
							{address?.slice(0, 7)}...{address?.slice(-6)}
							</button>
						) : (
							<button 
							onClick={connectWallet} 
							className="block py-3 px-4 font-medium text-center text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 active:shadow-none rounded-lg shadow md:inline"
							>
							Connect Wallet
							</button>
						)}
						</li>
					</div>
					</ul>
				</div>
				</div>
			</nav>

			<div className="max-w-3xl mx-auto p-5 rounded-lg justify-center items-center mt-4">
				<div className="flex flex-col bg-[#0c1012] p-5">
					<form>
						<div className="mb-5">
							<input onChange={(e) => setContent(e.target.value)} placeholder='What you want say?' className="border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"/>
						</div>
					</form>
					<button
						onClick={sendPost}
						className="block w-full h-10 font-medium text-center text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 active:shadow-none rounded-lg shadow md:inline"
					>
						New Post
					</button>
				</div>

				<div className="flex flex-col bg-[#0c1012] p-5 mt-6">
				{posts.map(post => (
					<div className="flex flex-col" key={post?.id}>
						<p className="pl-2 font-semibold">
							{post?.sender.slice(0, 5)}...{post?.sender.slice(-3)} - {formatTimestamp(post?.timestamp)}
						</p>

						<div className="pt-1 pb-1 pl-4">
							{post?.post}
						</div>

						<p onClick={() => sendLike(post?.id)} className="text-red-500 pb-2 pl-4 cursor-pointer">
							{post?.likes} Likes
						</p>

						<hr className="mb-4"/>
					</div>
				))}
				</div>
			</div>
		</div>
	);
}